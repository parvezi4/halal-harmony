'use server';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrModerator } from '@/lib/admin/access';
import { ADMIN_CAPABILITIES } from '@/lib/admin/capabilities';

export interface MemberFilters {
  search?: string;
  role?: 'ADMIN' | 'MODERATOR' | 'MEMBER' | '';
  profileStatus?: 'PENDING_REVIEW' | 'APPROVED' | 'SUSPENDED' | '';
  subscriptionStatus?: 'active' | 'expired' | 'none' | '';
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'email' | 'profileStatus';
  sortDir?: 'asc' | 'desc';
}

export interface MemberRow {
  id: string;
  email: string;
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
  emailVerified: Date | null;
  createdAt: Date;
  profile: {
    id: string;
    alias: string | null;
    fullName: string | null;
    status: 'PENDING_REVIEW' | 'APPROVED' | 'SUSPENDED';
    riskLabel: 'GREEN' | 'AMBER' | 'RED';
    onboardingCompletedAt: Date | null;
    gender: 'MALE' | 'FEMALE';
    country: string | null;
  } | null;
  activeSubscription: {
    status: string;
    endDate: Date;
  } | null;
  openReportCount: number;
}

export interface MembersResult {
  members: MemberRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MemberStats {
  total: number;
  admins: number;
  moderators: number;
  members: number;
  pendingVerification: number;
  suspended: number;
  activeSubscriptions: number;
}

// Read access: any admin or moderator with VERIFY_PROFILES capability
export async function getMembers(
  filters: MemberFilters = {}
): Promise<{ success: false; error: string } | { success: true; data: MembersResult }> {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.MANAGE_MEMBERS);
  if (!access.authorized || !access.userId) {
    return { success: false, error: 'Unauthorized' };
  }

  const {
    search = '',
    role = '',
    profileStatus = '',
    subscriptionStatus = '',
    page = 1,
    pageSize = 20,
    sortBy = 'createdAt',
    sortDir = 'desc',
  } = filters;

  const where: Prisma.UserWhereInput = {};

  if (role) {
    where.role = role as 'ADMIN' | 'MODERATOR' | 'MEMBER';
  }

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { profile: { alias: { contains: search, mode: 'insensitive' } } },
      { profile: { fullName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (profileStatus) {
    where.profile = { status: profileStatus as 'PENDING_REVIEW' | 'APPROVED' | 'SUSPENDED' };
  }

  const now = new Date();
  if (subscriptionStatus === 'active') {
    where.subscriptions = {
      some: {
        status: 'ACTIVE',
        endDate: { gte: now },
      },
    };
  } else if (subscriptionStatus === 'expired') {
    where.subscriptions = {
      some: { status: { in: ['EXPIRED', 'CANCELLED'] } },
    };
  } else if (subscriptionStatus === 'none') {
    where.subscriptions = { none: {} };
  }

  const orderBy: Prisma.UserOrderByWithRelationInput =
    sortBy === 'email'
      ? { email: sortDir }
      : sortBy === 'profileStatus'
        ? { profile: { status: sortDir } }
        : { createdAt: sortDir };

  const skip = (page - 1) * pageSize;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        profile: {
          select: {
            id: true,
            alias: true,
            fullName: true,
            status: true,
            riskLabel: true,
            onboardingCompletedAt: true,
            gender: true,
            country: true,
          },
        },
        subscriptions: {
          where: { status: 'ACTIVE', endDate: { gte: now } },
          orderBy: { endDate: 'desc' },
          take: 1,
          select: { status: true, endDate: true },
        },
        reportsAgainst: {
          where: { status: { in: ['OPEN', 'REVIEWING'] } },
          select: { id: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const members: MemberRow[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role as 'ADMIN' | 'MODERATOR' | 'MEMBER',
    emailVerified: u.emailVerified,
    createdAt: u.createdAt,
    profile: u.profile
      ? {
          id: u.profile.id,
          alias: u.profile.alias,
          fullName: u.profile.fullName,
          status: u.profile.status as 'PENDING_REVIEW' | 'APPROVED' | 'SUSPENDED',
          riskLabel: u.profile.riskLabel as 'GREEN' | 'AMBER' | 'RED',
          onboardingCompletedAt: u.profile.onboardingCompletedAt,
          gender: u.profile.gender as 'MALE' | 'FEMALE',
          country: u.profile.country,
        }
      : null,
    activeSubscription: u.subscriptions[0]
      ? { status: u.subscriptions[0].status, endDate: u.subscriptions[0].endDate }
      : null,
    openReportCount: u.reportsAgainst.length,
  }));

  return {
    success: true,
    data: {
      members,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getMemberStats(): Promise<
  { success: false; error: string } | { success: true; data: MemberStats }
> {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.MANAGE_MEMBERS);
  if (!access.authorized || !access.userId) {
    return { success: false, error: 'Unauthorized' };
  }

  const now = new Date();
  const [total, admins, moderators, pendingVerification, suspended, activeSubscriptions] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'MODERATOR' } }),
      prisma.profile.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.profile.count({ where: { status: 'SUSPENDED' } }),
      prisma.subscription.count({ where: { status: 'ACTIVE', endDate: { gte: now } } }),
    ]);

  return {
    success: true,
    data: {
      total,
      admins,
      moderators,
      members: total - admins - moderators,
      pendingVerification,
      suspended,
      activeSubscriptions,
    },
  };
}

export async function suspendMember(
  userId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.MANAGE_MEMBERS);
  if (!access.authorized || !access.userId) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!reason?.trim()) {
    return { success: false, error: 'Reason is required to suspend a member' };
  }

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true, status: true },
  });

  if (!profile) {
    return { success: false, error: 'Member profile not found' };
  }

  if (profile.status === 'SUSPENDED') {
    return { success: false, error: 'Member is already suspended' };
  }

  await prisma.$transaction([
    prisma.profile.update({
      where: { userId },
      data: { status: 'SUSPENDED' },
    }),
    prisma.moderationAuditLog.create({
      data: {
        actorId: access.userId,
        action: 'MEMBER_SUSPENDED',
        targetType: 'user',
        targetId: userId,
        reason,
        metadata: { profileId: profile.id },
      },
    }),
  ]);

  return { success: true };
}

export async function reactivateMember(
  userId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.MANAGE_MEMBERS);
  if (!access.authorized || !access.userId) {
    return { success: false, error: 'Unauthorized' };
  }

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true, status: true },
  });

  if (!profile) {
    return { success: false, error: 'Member profile not found' };
  }

  if (profile.status !== 'SUSPENDED') {
    return { success: false, error: 'Member is not currently suspended' };
  }

  await prisma.$transaction([
    prisma.profile.update({
      where: { userId },
      data: { status: 'APPROVED' },
    }),
    prisma.moderationAuditLog.create({
      data: {
        actorId: access.userId,
        action: 'MEMBER_REACTIVATED',
        targetType: 'user',
        targetId: userId,
        reason: reason ?? null,
        metadata: { profileId: profile.id },
      },
    }),
  ]);

  return { success: true };
}

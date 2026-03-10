'use server';

import { prisma } from '@/lib/prisma';
import { verifyAdminOrModerator } from '@/lib/admin/access';
import { ADMIN_CAPABILITIES } from '@/lib/admin/capabilities';
import { Prisma } from '@prisma/client';

export interface ProfileForVerification {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAlias: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'SUSPENDED';
  riskLabel: 'GREEN' | 'AMBER' | 'RED';
  riskNotes: string | null;
  riskLabeledAt: string | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Profile data summary
  gender: string;
  country: string | null;
  city: string | null;
  practicingLevel: string | null;
  maritalStatus: string | null;
}

interface PaginatedProfilesResponse {
  success: boolean;
  data?: {
    profiles: ProfileForVerification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  errors?: { general?: string };
}

interface VerificationResult {
  success: boolean;
  message?: string;
  errors?: { general?: string };
}

export async function getPendingProfiles(filters?: {
  status?: 'PENDING_REVIEW' | 'APPROVED' | 'SUSPENDED';
  riskLevel?: 'GREEN' | 'AMBER' | 'RED';
  search?: string;
  sortBy?: 'createdAt' | 'riskLabeledAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}): Promise<PaginatedProfilesResponse> {
  const { authorized } = await verifyAdminOrModerator(ADMIN_CAPABILITIES.VERIFY_PROFILES);

  if (!authorized) {
    return {
      success: false,
      errors: { general: 'Not authorized to view profiles' },
    };
  }

  try {
    const {
      status = 'PENDING_REVIEW',
      riskLevel,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters || {};

    const where: Prisma.ProfileWhereInput = {
      status,
    };

    if (riskLevel) {
      where.riskLabel = riskLevel;
    }

    if (search) {
      where.OR = [
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { alias: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.profile.count({ where });

    const profiles = await prisma.profile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder as Prisma.SortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data = profiles.map((profile) => ({
      id: profile.id,
      userId: profile.userId,
      userName: profile.fullName || 'N/A',
      userEmail: profile.user.email,
      userAlias: profile.alias || 'N/A',
      status: profile.status as 'PENDING_REVIEW' | 'APPROVED' | 'SUSPENDED',
      riskLabel: profile.riskLabel as 'GREEN' | 'AMBER' | 'RED',
      riskNotes: profile.riskNotes,
      riskLabeledAt: profile.riskLabeledAt?.toISOString() || null,
      onboardingCompletedAt: profile.onboardingCompletedAt?.toISOString() || null,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
      gender: profile.gender,
      country: profile.country,
      city: profile.city,
      practicingLevel: profile.practicingLevel,
      maritalStatus: profile.maritalStatus,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        profiles: data,
        total,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    console.error('Error fetching pending profiles:', error);
    return {
      success: false,
      errors: { general: 'Failed to fetch profiles' },
    };
  }
}

export async function approveProfile(
  profileId: string,
  reason?: string
): Promise<VerificationResult> {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.VERIFY_PROFILES);

  if (!access.authorized || !access.userId) {
    return {
      success: false,
      errors: { general: 'Not authorized to approve profiles' },
    };
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { userId: true, status: true },
    });

    if (!profile) {
      return {
        success: false,
        errors: { general: 'Profile not found' },
      };
    }

    await prisma.profile.update({
      where: { id: profileId },
      data: {
        status: 'APPROVED',
      },
    });

    await prisma.moderationAuditLog.create({
      data: {
        actorId: access.userId,
        action: 'PROFILE_APPROVED',
        targetType: 'Profile',
        targetId: profileId,
        reason,
        metadata: { userId: profile.userId } as Prisma.InputJsonValue,
      },
    });

    return {
      success: true,
      message: 'Profile approved successfully',
    };
  } catch (error) {
    console.error('Error approving profile:', error);
    return {
      success: false,
      errors: { general: 'Failed to approve profile' },
    };
  }
}

export async function suspendProfile(
  profileId: string,
  reason: string
): Promise<VerificationResult> {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.VERIFY_PROFILES);

  if (!access.authorized || !access.userId) {
    return {
      success: false,
      errors: { general: 'Not authorized to suspend profiles' },
    };
  }

  if (!reason || reason.trim().length === 0) {
    return {
      success: false,
      errors: { general: 'Suspension reason is required' },
    };
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { userId: true, status: true },
    });

    if (!profile) {
      return {
        success: false,
        errors: { general: 'Profile not found' },
      };
    }

    await prisma.profile.update({
      where: { id: profileId },
      data: {
        status: 'SUSPENDED',
      },
    });

    await prisma.moderationAuditLog.create({
      data: {
        actorId: access.userId,
        action: 'PROFILE_SUSPENDED',
        targetType: 'Profile',
        targetId: profileId,
        reason,
        metadata: { userId: profile.userId } as Prisma.InputJsonValue,
      },
    });

    return {
      success: true,
      message: 'Profile suspended successfully',
    };
  } catch (error) {
    console.error('Error suspending profile:', error);
    return {
      success: false,
      errors: { general: 'Failed to suspend profile' },
    };
  }
}

export async function updateProfileRiskLabel(
  profileId: string,
  riskLabel: 'GREEN' | 'AMBER' | 'RED',
  riskNotes: string
): Promise<VerificationResult> {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.UPDATE_RISK_LABELS);

  if (!access.authorized || !access.userId) {
    return {
      success: false,
      errors: { general: 'Not authorized to update risk labels' },
    };
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { userId: true },
    });

    if (!profile) {
      return {
        success: false,
        errors: { general: 'Profile not found' },
      };
    }

    await prisma.profile.update({
      where: { id: profileId },
      data: {
        riskLabel,
        riskNotes,
        riskLabeledAt: new Date(),
      },
    });

    await prisma.moderationAuditLog.create({
      data: {
        actorId: access.userId,
        action: 'RISK_LABEL_UPDATED',
        targetType: 'Profile',
        targetId: profileId,
        reason: riskNotes,
        metadata: { riskLabel, userId: profile.userId } as Prisma.InputJsonValue,
      },
    });

    return {
      success: true,
      message: 'Risk label updated successfully',
    };
  } catch (error) {
    console.error('Error updating risk label:', error);
    return {
      success: false,
      errors: { general: 'Failed to update risk label' },
    };
  }
}

export async function getProfileVerificationStats() {
  const { authorized } = await verifyAdminOrModerator(ADMIN_CAPABILITIES.VERIFY_PROFILES);

  if (!authorized) {
    return {
      success: false,
      errors: { general: 'Not authorized' },
    };
  }

  try {
    const [pending, approved, suspended, flaggedAMBER, flaggedRED] = await Promise.all([
      prisma.profile.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.profile.count({ where: { status: 'APPROVED' } }),
      prisma.profile.count({ where: { status: 'SUSPENDED' } }),
      prisma.profile.count({ where: { riskLabel: 'AMBER' } }),
      prisma.profile.count({ where: { riskLabel: 'RED' } }),
    ]);

    return {
      success: true,
      data: {
        pending,
        approved,
        suspended,
        flaggedAMBER,
        flaggedRED,
      },
    };
  } catch (error) {
    console.error('Error fetching profile verification stats:', error);
    return {
      success: false,
      errors: { general: 'Failed to fetch stats' },
    };
  }
}

'use server';

import { prisma } from '@/lib/prisma';
import { verifyAdminOrModerator } from '@/lib/admin/access';
import { ADMIN_CAPABILITIES } from '@/lib/admin/capabilities';

interface PendingProfile {
  id: string;
  userId: string;
  email: string;
  alias: string;
  fullName: string | null;
  gender: 'MALE' | 'FEMALE';
  country: string | null;
  city: string | null;
  onboardingCompletedAt: string | null;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'SUSPENDED';
  photoCount: number;
}

function unauthorizedResponse() {
  return {
    success: false,
    errors: { general: 'Not authorized' },
  };
}

export async function getPendingProfiles() {
  const { authorized } = await verifyAdminOrModerator(ADMIN_CAPABILITIES.VERIFY_PROFILES);

  if (!authorized) {
    return unauthorizedResponse();
  }

  try {
    const profiles = await prisma.profile.findMany({
      where: { status: 'PENDING_REVIEW' },
      orderBy: { onboardingCompletedAt: 'asc' },
      select: {
        id: true,
        userId: true,
        alias: true,
        fullName: true,
        gender: true,
        country: true,
        city: true,
        onboardingCompletedAt: true,
        status: true,
        user: {
          select: {
            email: true,
          },
        },
        _count: {
          select: {
            photos: true,
          },
        },
      },
    });

    const formatted: PendingProfile[] = profiles.map((profile) => ({
      id: profile.id,
      userId: profile.userId,
      email: profile.user.email,
      alias: profile.alias || 'Unknown',
      fullName: profile.fullName,
      gender: profile.gender,
      country: profile.country,
      city: profile.city,
      onboardingCompletedAt: profile.onboardingCompletedAt?.toISOString() || null,
      status: profile.status,
      photoCount: profile._count.photos,
    }));

    return {
      success: true,
      data: formatted,
    };
  } catch (error) {
    console.error('Error fetching pending profiles:', error);
    return {
      success: false,
      errors: { general: 'Failed to fetch pending profiles' },
    };
  }
}

export async function approveProfile(profileId: string) {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.VERIFY_PROFILES);

  if (!access.authorized || !access.userId) {
    return unauthorizedResponse();
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!profile) {
      return {
        success: false,
        errors: { general: 'Profile not found' },
      };
    }

    if (profile.status !== 'PENDING_REVIEW') {
      return {
        success: false,
        errors: { general: 'Only pending profiles can be approved' },
      };
    }

    await prisma.profile.update({
      where: { id: profileId },
      data: { status: 'APPROVED' },
    });

    await prisma.moderationAuditLog.create({
      data: {
        actorId: access.userId,
        action: 'APPROVE_PROFILE',
        targetType: 'Profile',
        targetId: profileId,
      },
    });

    return {
      success: true,
      data: { profileId },
    };
  } catch (error) {
    console.error('Error approving profile:', error);
    return {
      success: false,
      errors: { general: 'Failed to approve profile' },
    };
  }
}

export async function suspendProfile(profileId: string, reason?: string) {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.VERIFY_PROFILES);

  if (!access.authorized || !access.userId) {
    return unauthorizedResponse();
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!profile) {
      return {
        success: false,
        errors: { general: 'Profile not found' },
      };
    }

    if (profile.status === 'SUSPENDED') {
      return {
        success: false,
        errors: { general: 'Profile is already suspended' },
      };
    }

    await prisma.profile.update({
      where: { id: profileId },
      data: { status: 'SUSPENDED' },
    });

    await prisma.moderationAuditLog.create({
      data: {
        actorId: access.userId,
        action: 'SUSPEND_PROFILE',
        targetType: 'Profile',
        targetId: profileId,
        reason,
      },
    });

    return {
      success: true,
      data: { profileId },
    };
  } catch (error) {
    console.error('Error suspending profile:', error);
    return {
      success: false,
      errors: { general: 'Failed to suspend profile' },
    };
  }
}

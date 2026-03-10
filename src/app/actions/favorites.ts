'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';

export type FavoritesActionResponse = {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
  data?: {
    targetUserId?: string;
    isFavorited?: boolean;
    favorites?: Array<{
      userId: string;
      profileId: string;
      alias: string | null;
      age: number | null;
      ageRangeLabel: string | null;
      country: string | null;
      cityOrRegion: string | null;
      practicingLevel: string | null;
      hijabOrBeard: string | null;
      smoking: boolean;
      primaryPhotoUrl: string | null;
      primaryPhotoBlurred: boolean;
    }>;
    freeTier?: {
      isPremium: boolean;
      dailyLimit: number;
      viewedToday: number;
      remaining: number;
    };
  };
};

function getOppositeGender(gender: 'MALE' | 'FEMALE'): 'MALE' | 'FEMALE' {
  return gender === 'MALE' ? 'FEMALE' : 'MALE';
}

async function getFavoriteContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: { general: 'Unauthorized' } };
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: {
      userId: true,
      gender: true,
      onboardingCompletedAt: true,
    },
  });

  if (!profile) {
    return { error: { general: 'Profile not found' } };
  }

  if (!profile.onboardingCompletedAt) {
    return { error: { general: 'Complete onboarding to use favorites' } };
  }

  return {
    userId: profile.userId,
    targetGender: getOppositeGender(profile.gender),
  };
}

function calculateAge(dateOfBirth: Date | null): number | null {
  if (!dateOfBirth) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age -= 1;
  }
  return age;
}

async function getFreeTierStatus(userId: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [activeSubscription, viewedProfiles] = await Promise.all([
    prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gte: now },
      },
      select: { id: true },
    }),
    prisma.profileView.findMany({
      where: {
        viewerId: userId,
        viewedAt: { gte: todayStart },
      },
      select: { viewedProfileId: true },
      distinct: ['viewedProfileId'],
    }),
  ]);

  const isPremium = Boolean(activeSubscription);
  const dailyLimit = 5;
  const viewedToday = viewedProfiles.length;
  const remaining = isPremium ? Number.MAX_SAFE_INTEGER : Math.max(0, dailyLimit - viewedToday);

  return {
    isPremium,
    dailyLimit,
    viewedToday,
    remaining,
  };
}

export async function toggleFavorite(targetUserId: string): Promise<FavoritesActionResponse> {
  try {
    const context = await getFavoriteContext();
    if ('error' in context) {
      return { success: false, errors: context.error };
    }

    if (!targetUserId) {
      return { success: false, errors: { targetUserId: 'Target user is required' } };
    }

    if (context.userId === targetUserId) {
      return { success: false, errors: { targetUserId: 'You cannot favorite yourself' } };
    }

    const targetProfile = await prisma.profile.findUnique({
      where: { userId: targetUserId },
      select: {
        userId: true,
        gender: true,
        onboardingCompletedAt: true,
        status: true,
      },
    });

    if (!targetProfile) {
      return { success: false, errors: { targetUserId: 'Profile not found' } };
    }

    if (
      targetProfile.gender !== context.targetGender ||
      !targetProfile.onboardingCompletedAt ||
      targetProfile.status !== 'APPROVED'
    ) {
      return { success: false, errors: { targetUserId: 'Profile is not searchable' } };
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_favoriteUserId: {
          userId: context.userId,
          favoriteUserId: targetUserId,
        },
      },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return {
        success: true,
        message: 'Removed from favorites',
        data: {
          targetUserId,
          isFavorited: false,
        },
      };
    }

    await prisma.favorite.create({
      data: {
        userId: context.userId,
        favoriteUserId: targetUserId,
      },
    });

    return {
      success: true,
      message: 'Added to favorites',
      data: {
        targetUserId,
        isFavorited: true,
      },
    };
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return {
      success: false,
      errors: { general: 'Failed to update favorite' },
    };
  }
}

export async function getFavorites(): Promise<FavoritesActionResponse> {
  try {
    const context = await getFavoriteContext();
    if ('error' in context) {
      return { success: false, errors: context.error };
    }

    const freeTier = await getFreeTierStatus(context.userId);

    const favorites = await prisma.favorite.findMany({
      where: { userId: context.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        favoriteUser: {
          select: {
            id: true,
            profile: {
              select: {
                id: true,
                alias: true,
                dateOfBirth: true,
                ageRangeLabel: true,
                country: true,
                city: true,
                region: true,
                practicingLevel: true,
                hijabOrBeard: true,
                smoking: true,
                photosVisibleTo: true,
                status: true,
                onboardingCompletedAt: true,
                photos: {
                  where: { isApproved: true },
                  orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
                  take: 1,
                  select: {
                    url: true,
                    isBlurred: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const normalized = favorites
      .filter(
        (entry) =>
          entry.favoriteUser.profile?.status === 'APPROVED' &&
          Boolean(entry.favoriteUser.profile?.onboardingCompletedAt)
      )
      .map((entry) => {
        const profile = entry.favoriteUser.profile;
        const primaryPhoto = profile?.photos?.[0];
        const canShowPhoto =
          profile?.photosVisibleTo === 'ALL_MEMBERS' ||
          (profile?.photosVisibleTo === 'SUBSCRIBERS_ONLY' && freeTier.isPremium);

        return {
          userId: entry.favoriteUser.id,
          profileId: profile?.id ?? '',
          alias: profile?.alias ?? null,
          age: calculateAge(profile?.dateOfBirth ?? null),
          ageRangeLabel: profile?.ageRangeLabel ?? null,
          country: profile?.country ?? null,
          cityOrRegion: profile?.region || profile?.city || null,
          practicingLevel: profile?.practicingLevel ?? null,
          hijabOrBeard: profile?.hijabOrBeard ?? null,
          smoking: Boolean(profile?.smoking),
          primaryPhotoUrl: canShowPhoto ? (primaryPhoto?.url ?? null) : null,
          primaryPhotoBlurred: canShowPhoto ? Boolean(primaryPhoto?.isBlurred) : false,
        };
      });

    return {
      success: true,
      data: {
        favorites: normalized,
        freeTier,
      },
    };
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return {
      success: false,
      errors: { general: 'Failed to fetch favorites' },
    };
  }
}

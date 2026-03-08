'use server';

import { getServerSession } from 'next-auth/next';
import type { Prisma } from '@prisma/client';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';

const SEARCH_PAGE_SIZE = 20;
const FREE_DAILY_PROFILE_VIEW_LIMIT = 5;

type SortOption = 'newest';

function normalizeTextFilter(value?: string): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export type SearchFilters = {
  minAge?: number;
  maxAge?: number;
  country?: string;
  cityOrRegion?: string;
  maritalStatus?: string;
  practicingLevel?: string;
  hijabOrBeard?: string;
  smoking?: 'yes' | 'no';
  education?: string;
  profession?: string;
  willingToRelocate?: 'yes' | 'maybe' | 'no';
};

export type SearchResultItem = {
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
  isFavorited: boolean;
};

export type SearchResponse = {
  success: boolean;
  data?: {
    results: SearchResultItem[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
    targetGender: 'MALE' | 'FEMALE';
    freeTier: {
      isPremium: boolean;
      dailyLimit: number;
      viewedToday: number;
      remaining: number;
    };
  };
  errors?: Record<string, string>;
};

export type SearchProfileDetailResponse = {
  success: boolean;
  data?: {
    userId: string;
    profileId: string;
    alias: string | null;
    age: number | null;
    ageRangeLabel: string | null;
    country: string | null;
    city: string | null;
    region: string | null;
    nationality: string | null;
    ethnicity: string | null;
    practicingLevel: string | null;
    prayerHabit: string | null;
    madhhabOrManhaj: string | null;
    hijabOrBeard: string | null;
    smoking: boolean;
    maritalStatus: string | null;
    numberOfChildren: number | null;
    willingToRelocate: string | null;
    relocateNotes: string | null;
    education: string | null;
    profession: string | null;
    about: string | null;
    familyBackground: string | null;
    preferences: string | null;
    photos: Array<{
      url: string;
      isBlurred: boolean;
    }>;
    isFavorited: boolean;
    freeTier: {
      isPremium: boolean;
      dailyLimit: number;
      viewedToday: number;
      remaining: number;
    };
  };
  errors?: Record<string, string>;
};

function getOppositeGender(gender: 'MALE' | 'FEMALE'): 'MALE' | 'FEMALE' {
  return gender === 'MALE' ? 'FEMALE' : 'MALE';
}

function getDateBoundsFromAge(minAge?: number, maxAge?: number): { gte?: Date; lte?: Date } {
  const now = new Date();
  const bounds: { gte?: Date; lte?: Date } = {};

  if (typeof minAge === 'number') {
    const youngestDob = new Date(now);
    youngestDob.setFullYear(now.getFullYear() - minAge);
    bounds.lte = youngestDob;
  }

  if (typeof maxAge === 'number') {
    const oldestDob = new Date(now);
    oldestDob.setFullYear(now.getFullYear() - maxAge - 1);
    oldestDob.setDate(oldestDob.getDate() + 1);
    bounds.gte = oldestDob;
  }

  return bounds;
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

async function getSearchContext() {
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
    return { error: { general: 'Complete onboarding to use search' } };
  }

  return {
    userId: session.user.id,
    targetGender: getOppositeGender(profile.gender),
  };
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
  const viewedToday = viewedProfiles.length;
  const remaining = isPremium
    ? Number.MAX_SAFE_INTEGER
    : Math.max(0, FREE_DAILY_PROFILE_VIEW_LIMIT - viewedToday);

  return {
    isPremium,
    dailyLimit: FREE_DAILY_PROFILE_VIEW_LIMIT,
    viewedToday,
    remaining,
  };
}

export async function searchProfiles(input: {
  filters: SearchFilters;
  page?: number;
  pageSize?: number;
  sort?: SortOption;
}): Promise<SearchResponse> {
  try {
    const context = await getSearchContext();
    if ('error' in context) {
      return { success: false, errors: context.error };
    }

    const { userId, targetGender } = context;
    const pageSize = input.pageSize && input.pageSize > 0 ? input.pageSize : SEARCH_PAGE_SIZE;
    const page = input.page && input.page > 0 ? input.page : 1;

    const filters = {
      ...input.filters,
      country: normalizeTextFilter(input.filters.country),
      cityOrRegion: normalizeTextFilter(input.filters.cityOrRegion),
      maritalStatus: normalizeTextFilter(input.filters.maritalStatus),
      practicingLevel: normalizeTextFilter(input.filters.practicingLevel),
      hijabOrBeard: normalizeTextFilter(input.filters.hijabOrBeard),
      education: normalizeTextFilter(input.filters.education),
      profession: normalizeTextFilter(input.filters.profession),
      willingToRelocate: normalizeTextFilter(input.filters.willingToRelocate) as
        | 'yes'
        | 'maybe'
        | 'no'
        | undefined,
      smoking: normalizeTextFilter(input.filters.smoking) as 'yes' | 'no' | undefined,
    };
    const where: Prisma.ProfileWhereInput = {
      userId: { not: userId },
      gender: targetGender,
      status: 'APPROVED',
      onboardingCompletedAt: { not: null },
    };

    const dobBounds = getDateBoundsFromAge(filters.minAge, filters.maxAge);
    if (dobBounds.gte || dobBounds.lte) {
      where.dateOfBirth = {
        ...(dobBounds.gte ? { gte: dobBounds.gte } : {}),
        ...(dobBounds.lte ? { lte: dobBounds.lte } : {}),
      };
    }

    if (filters.country) {
      where.country = { contains: filters.country, mode: 'insensitive' };
    }

    if (filters.cityOrRegion) {
      where.OR = [
        { city: { contains: filters.cityOrRegion, mode: 'insensitive' } },
        { region: { contains: filters.cityOrRegion, mode: 'insensitive' } },
      ];
    }

    if (filters.maritalStatus) {
      where.maritalStatus = filters.maritalStatus;
    }

    if (filters.practicingLevel) {
      where.practicingLevel = filters.practicingLevel;
    }

    if (filters.hijabOrBeard) {
      where.hijabOrBeard = filters.hijabOrBeard;
    }

    if (filters.smoking) {
      where.smoking = filters.smoking === 'yes';
    }

    if (filters.education) {
      where.education = { contains: filters.education, mode: 'insensitive' };
    }

    if (filters.profession) {
      where.profession = { contains: filters.profession, mode: 'insensitive' };
    }

    if (filters.willingToRelocate) {
      where.willingToRelocate = filters.willingToRelocate;
    }

    const orderBy: Prisma.ProfileOrderByWithRelationInput =
      input.sort === 'newest' || !input.sort ? { createdAt: 'desc' } : { createdAt: 'desc' };

    const [total, profiles, freeTierStatus] = await Promise.all([
      prisma.profile.count({ where }),
      prisma.profile.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          userId: true,
          alias: true,
          ageRangeLabel: true,
          dateOfBirth: true,
          country: true,
          city: true,
          region: true,
          practicingLevel: true,
          hijabOrBeard: true,
          smoking: true,
          photosVisibleTo: true,
          photos: {
            where: {
              isApproved: true,
            },
            orderBy: [
              { isPrimary: 'desc' },
              { createdAt: 'asc' },
            ],
            select: {
              url: true,
              isBlurred: true,
            },
            take: 1,
          },
        },
      }),
      getFreeTierStatus(userId),
    ]);

    const favoriteUsers = await prisma.favorite.findMany({
      where: {
        userId,
        favoriteUserId: { in: profiles.map((profile) => profile.userId) },
      },
      select: { favoriteUserId: true },
    });

    const favoriteUserIds = new Set(favoriteUsers.map((entry) => entry.favoriteUserId));

    const results: SearchResultItem[] = profiles.map((profile) => {
      const primaryPhoto = profile.photos[0];
      const canShowPhoto =
        profile.photosVisibleTo === 'ALL_MEMBERS' ||
        (profile.photosVisibleTo === 'SUBSCRIBERS_ONLY' && freeTierStatus.isPremium);

      return {
        userId: profile.userId,
        profileId: profile.id,
        alias: profile.alias,
        age: calculateAge(profile.dateOfBirth),
        ageRangeLabel: profile.ageRangeLabel,
        country: profile.country,
        cityOrRegion: profile.region || profile.city,
        practicingLevel: profile.practicingLevel,
        hijabOrBeard: profile.hijabOrBeard,
        smoking: Boolean(profile.smoking),
        primaryPhotoUrl: canShowPhoto ? (primaryPhoto?.url ?? null) : null,
        primaryPhotoBlurred: canShowPhoto ? Boolean(primaryPhoto?.isBlurred) : false,
        isFavorited: favoriteUserIds.has(profile.userId),
      };
    });

    return {
      success: true,
      data: {
        results,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
        targetGender,
        freeTier: freeTierStatus,
      },
    };
  } catch (error) {
    console.error('Error searching profiles:', error);
    return {
      success: false,
      errors: { general: 'Failed to search profiles' },
    };
  }
}

export async function getSearchProfileDetail(targetUserId: string): Promise<SearchProfileDetailResponse> {
  try {
    const context = await getSearchContext();
    if ('error' in context) {
      return { success: false, errors: context.error };
    }

    const { userId, targetGender } = context;
    if (!targetUserId) {
      return { success: false, errors: { targetUserId: 'Target user is required' } };
    }

    if (targetUserId === userId) {
      return { success: false, errors: { targetUserId: 'You cannot view your own profile from search' } };
    }

    const [profile, favorite, freeTier] = await Promise.all([
      prisma.profile.findUnique({
        where: { userId: targetUserId },
        select: {
          id: true,
          userId: true,
          gender: true,
          status: true,
          onboardingCompletedAt: true,
          alias: true,
          ageRangeLabel: true,
          dateOfBirth: true,
          country: true,
          city: true,
          region: true,
          nationality: true,
          ethnicity: true,
          practicingLevel: true,
          prayerHabit: true,
          madhhabOrManhaj: true,
          hijabOrBeard: true,
          smoking: true,
          maritalStatus: true,
          numberOfChildren: true,
          willingToRelocate: true,
          relocateNotes: true,
          education: true,
          profession: true,
          about: true,
          familyBackground: true,
          preferences: true,
          photosVisibleTo: true,
          photos: {
            where: { isApproved: true },
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
            select: {
              url: true,
              isBlurred: true,
            },
            take: 5,
          },
        },
      }),
      prisma.favorite.findUnique({
        where: {
          userId_favoriteUserId: {
            userId,
            favoriteUserId: targetUserId,
          },
        },
        select: { id: true },
      }),
      getFreeTierStatus(userId),
    ]);

    if (!profile) {
      return { success: false, errors: { general: 'Profile not found' } };
    }

    if (
      profile.gender !== targetGender ||
      profile.status !== 'APPROVED' ||
      !profile.onboardingCompletedAt
    ) {
      return { success: false, errors: { general: 'Profile is not available in search' } };
    }

    const canShowPhoto =
      profile.photosVisibleTo === 'ALL_MEMBERS' ||
      (profile.photosVisibleTo === 'SUBSCRIBERS_ONLY' && freeTier.isPremium);

    return {
      success: true,
      data: {
        userId: profile.userId,
        profileId: profile.id,
        alias: profile.alias,
        age: calculateAge(profile.dateOfBirth),
        ageRangeLabel: profile.ageRangeLabel,
        country: profile.country,
        city: profile.city,
        region: profile.region,
        nationality: profile.nationality,
        ethnicity: profile.ethnicity,
        practicingLevel: profile.practicingLevel,
        prayerHabit: profile.prayerHabit,
        madhhabOrManhaj: profile.madhhabOrManhaj,
        hijabOrBeard: profile.hijabOrBeard,
        smoking: Boolean(profile.smoking),
        maritalStatus: profile.maritalStatus,
        numberOfChildren: profile.numberOfChildren,
        willingToRelocate: profile.willingToRelocate,
        relocateNotes: profile.relocateNotes,
        education: profile.education,
        profession: profile.profession,
        about: profile.about,
        familyBackground: profile.familyBackground,
        preferences: profile.preferences,
        photos: canShowPhoto ? profile.photos : [],
        isFavorited: Boolean(favorite),
        freeTier,
      },
    };
  } catch (error) {
    console.error('Error fetching search profile detail:', error);
    return {
      success: false,
      errors: { general: 'Failed to load profile detail' },
    };
  }
}

export async function canViewMoreProfiles(): Promise<{
  success: boolean;
  canView: boolean;
  freeTier?: {
    isPremium: boolean;
    dailyLimit: number;
    viewedToday: number;
    remaining: number;
  };
  errors?: Record<string, string>;
}> {
  const context = await getSearchContext();
  if ('error' in context) {
    return { success: false, canView: false, errors: context.error };
  }

  const freeTier = await getFreeTierStatus(context.userId);
  if (freeTier.isPremium) {
    return { success: true, canView: true, freeTier };
  }

  return {
    success: true,
    canView: freeTier.remaining > 0,
    freeTier,
  };
}

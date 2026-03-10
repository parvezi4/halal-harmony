import { getServerSession } from 'next-auth/next';
import { getFavorites, toggleFavorite } from '@/app/actions/favorites';
import { prisma } from '@/lib/prisma';

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/auth', () => ({
  authOptions: {},
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    profile: {
      findUnique: jest.fn(),
    },
    favorite: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    subscription: {
      findFirst: jest.fn(),
    },
    profileView: {
      findMany: jest.fn(),
    },
  },
}));

describe('favorites actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('toggleFavorite should reject unauthorized users', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const result = await toggleFavorite('user-2');

    expect(result.success).toBe(false);
    expect(result.errors?.general).toBe('Unauthorized');
  });

  it('toggleFavorite should reject self-favoriting', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } });
    (prisma.profile.findUnique as jest.Mock).mockResolvedValue({
      userId: 'user-1',
      gender: 'MALE',
      onboardingCompletedAt: new Date(),
    });

    const result = await toggleFavorite('user-1');

    expect(result.success).toBe(false);
    expect(result.errors?.targetUserId).toBe('You cannot favorite yourself');
    expect(prisma.profile.findUnique).toHaveBeenCalledTimes(1);
  });

  it('toggleFavorite should add a favorite when none exists', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } });
    (prisma.profile.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        userId: 'user-1',
        gender: 'MALE',
        onboardingCompletedAt: new Date(),
      })
      .mockResolvedValueOnce({
        userId: 'user-2',
        gender: 'FEMALE',
        onboardingCompletedAt: new Date(),
        status: 'APPROVED',
      });
    (prisma.favorite.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await toggleFavorite('user-2');

    expect(result.success).toBe(true);
    expect(result.data?.isFavorited).toBe(true);
    expect(prisma.favorite.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        favoriteUserId: 'user-2',
      },
    });
  });

  it('toggleFavorite should remove an existing favorite', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } });
    (prisma.profile.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        userId: 'user-1',
        gender: 'MALE',
        onboardingCompletedAt: new Date(),
      })
      .mockResolvedValueOnce({
        userId: 'user-2',
        gender: 'FEMALE',
        onboardingCompletedAt: new Date(),
        status: 'APPROVED',
      });
    (prisma.favorite.findUnique as jest.Mock).mockResolvedValue({ id: 'fav-1' });

    const result = await toggleFavorite('user-2');

    expect(result.success).toBe(true);
    expect(result.data?.isFavorited).toBe(false);
    expect(prisma.favorite.delete).toHaveBeenCalledWith({ where: { id: 'fav-1' } });
  });

  it('getFavorites should filter non-searchable profiles and hide subscriber photos for free users', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } });
    (prisma.profile.findUnique as jest.Mock).mockResolvedValue({
      userId: 'user-1',
      gender: 'MALE',
      onboardingCompletedAt: new Date(),
    });
    (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.profileView.findMany as jest.Mock).mockResolvedValue([
      { viewedProfileId: 'a' },
      { viewedProfileId: 'b' },
    ]);
    (prisma.favorite.findMany as jest.Mock).mockResolvedValue([
      {
        favoriteUser: {
          id: 'user-2',
          profile: {
            id: 'profile-2',
            alias: 'Fatima',
            dateOfBirth: new Date('1996-06-15'),
            ageRangeLabel: null,
            country: 'United Kingdom',
            city: 'Manchester',
            region: null,
            practicingLevel: 'Practicing',
            hijabOrBeard: 'Hijab',
            smoking: false,
            photosVisibleTo: 'SUBSCRIBERS_ONLY',
            status: 'APPROVED',
            onboardingCompletedAt: new Date(),
            photos: [{ url: 'https://example.com/photo.jpg', isBlurred: true }],
          },
        },
      },
      {
        favoriteUser: {
          id: 'user-3',
          profile: {
            id: 'profile-3',
            alias: 'Suspended user',
            dateOfBirth: new Date('1993-03-03'),
            ageRangeLabel: null,
            country: 'United Kingdom',
            city: 'Leicester',
            region: null,
            practicingLevel: 'Practicing',
            hijabOrBeard: 'Hijab',
            smoking: false,
            photosVisibleTo: 'ALL_MEMBERS',
            status: 'SUSPENDED',
            onboardingCompletedAt: new Date(),
            photos: [{ url: 'https://example.com/photo2.jpg', isBlurred: false }],
          },
        },
      },
    ]);

    const result = await getFavorites();

    expect(result.success).toBe(true);
    expect(result.data?.favorites).toHaveLength(1);
    expect(result.data?.favorites?.[0]?.userId).toBe('user-2');
    expect(result.data?.favorites?.[0]?.primaryPhotoUrl).toBeNull();
    expect(result.data?.freeTier?.isPremium).toBe(false);
    expect(result.data?.freeTier?.remaining).toBe(3);
  });
});

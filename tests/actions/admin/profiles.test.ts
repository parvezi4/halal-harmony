import { prisma } from '@/lib/prisma';
import { verifyAdminOrModerator } from '@/lib/admin/access';
import { getPendingProfiles, approveProfile, suspendProfile } from '@/app/actions/admin/profiles';

jest.mock('@/lib/admin/access', () => ({
  verifyAdminOrModerator: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    profile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    moderationAuditLog: {
      create: jest.fn(),
    },
  },
}));

const mockVerifyAdminOrModerator = verifyAdminOrModerator as jest.Mock;

describe('Admin Profile Moderation Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPendingProfiles', () => {
    it('should reject unauthorized users', async () => {
      mockVerifyAdminOrModerator.mockResolvedValue({
        authorized: false,
        userId: 'user1',
        role: 'MEMBER',
      });

      const result = await getPendingProfiles();

      expect(result.success).toBe(false);
      if ('errors' in result) {
        expect(result.errors?.general).toBe('Not authorized');
      }
    });

    it('should return formatted pending profiles', async () => {
      mockVerifyAdminOrModerator.mockResolvedValue({
        authorized: true,
        userId: 'mod1',
        role: 'MODERATOR',
      });
      (prisma.profile.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'profile1',
          userId: 'user1',
          alias: 'Fatima',
          fullName: 'Fatima Khan',
          gender: 'FEMALE',
          country: 'United Kingdom',
          city: 'Manchester',
          onboardingCompletedAt: new Date('2026-03-10T00:00:00.000Z'),
          status: 'PENDING_REVIEW',
          user: {
            email: 'fatima@example.com',
          },
          _count: {
            photos: 2,
          },
        },
      ]);

      const result = await getPendingProfiles();

      expect(result.success).toBe(true);
      if ('data' in result) {
        expect(result.data).toEqual([
        {
          id: 'profile1',
          userId: 'user1',
          email: 'fatima@example.com',
          alias: 'Fatima',
          fullName: 'Fatima Khan',
          gender: 'FEMALE',
          country: 'United Kingdom',
          city: 'Manchester',
          onboardingCompletedAt: '2026-03-10T00:00:00.000Z',
          status: 'PENDING_REVIEW',
          photoCount: 2,
        },
        ]);
      }
    });
  });

  describe('approveProfile', () => {
    it('should reject unauthorized users', async () => {
      mockVerifyAdminOrModerator.mockResolvedValue({
        authorized: false,
        userId: null,
        role: null,
      });

      const result = await approveProfile('profile1');

      expect(result.success).toBe(false);
      if ('errors' in result) {
        expect(result.errors?.general).toBe('Not authorized');
      }
    });

    it('should approve pending profile and write audit log', async () => {
      mockVerifyAdminOrModerator.mockResolvedValue({
        authorized: true,
        userId: 'admin1',
        role: 'ADMIN',
      });
      (prisma.profile.findUnique as jest.Mock).mockResolvedValue({
        id: 'profile1',
        status: 'PENDING_REVIEW',
      });

      const result = await approveProfile('profile1');

      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { id: 'profile1' },
        data: { status: 'APPROVED' },
      });
      expect(prisma.moderationAuditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 'admin1',
          action: 'APPROVE_PROFILE',
          targetType: 'Profile',
          targetId: 'profile1',
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('suspendProfile', () => {
    it('should suspend non-suspended profile and write reason to audit log', async () => {
      mockVerifyAdminOrModerator.mockResolvedValue({
        authorized: true,
        userId: 'admin1',
        role: 'ADMIN',
      });
      (prisma.profile.findUnique as jest.Mock).mockResolvedValue({
        id: 'profile1',
        status: 'PENDING_REVIEW',
      });

      const result = await suspendProfile('profile1', 'Incomplete wali details');

      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { id: 'profile1' },
        data: { status: 'SUSPENDED' },
      });
      expect(prisma.moderationAuditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 'admin1',
          action: 'SUSPEND_PROFILE',
          targetType: 'Profile',
          targetId: 'profile1',
          reason: 'Incomplete wali details',
        },
      });
      expect(result.success).toBe(true);
    });
  });
});

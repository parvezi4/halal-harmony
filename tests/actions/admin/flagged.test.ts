import { prisma } from '@/lib/prisma';
import { verifyAdminOrModerator } from '@/lib/admin/access';
import { resolveAllAndSuspend } from '@/app/actions/admin/flagged';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    profile: {
      findUnique: jest.fn(),
        update: jest.fn(),
    },
    report: {
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    moderationAuditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/admin/access', () => ({
  verifyAdminOrModerator: jest.fn(),
}));

const mockVerify = verifyAdminOrModerator as jest.Mock;
const mockFindUnique = prisma.profile.findUnique as jest.Mock;
const mockCount = prisma.report.count as jest.Mock;
const mockTransaction = prisma.$transaction as jest.Mock;

describe('resolveAllAndSuspend', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authorization', () => {
    it('returns error when not authenticated', async () => {
      mockVerify.mockResolvedValue({ authorized: false, userId: null, role: null });

      const result = await resolveAllAndSuspend('user1', 'profile1', 'reason');

      expect(result.success).toBe(false);
      expect(result.errors?.general).toBe('Not authorized');
      expect(mockFindUnique).not.toHaveBeenCalled();
    });

    it('returns error when user is not authorized', async () => {
      mockVerify.mockResolvedValue({ authorized: false, userId: 'admin1', role: 'MEMBER' });

      const result = await resolveAllAndSuspend('user1', 'profile1', 'reason');

      expect(result.success).toBe(false);
      expect(result.errors?.general).toBe('Not authorized');
    });
  });

  describe('Input validation', () => {
    beforeEach(() => {
      mockVerify.mockResolvedValue({ authorized: true, userId: 'admin1', role: 'ADMIN' });
    });

    it('returns error when reason is empty string', async () => {
      const result = await resolveAllAndSuspend('user1', 'profile1', '');

      expect(result.success).toBe(false);
      expect(result.errors?.general).toBe('Reason is required');
      expect(mockFindUnique).not.toHaveBeenCalled();
    });

    it('returns error when reason is whitespace only', async () => {
      const result = await resolveAllAndSuspend('user1', 'profile1', '   ');

      expect(result.success).toBe(false);
      expect(result.errors?.general).toBe('Reason is required');
    });
  });

  describe('Profile validation', () => {
    beforeEach(() => {
      mockVerify.mockResolvedValue({ authorized: true, userId: 'admin1', role: 'ADMIN' });
    });

    it('returns error when profile is not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await resolveAllAndSuspend('user1', 'profileX', 'spam');

      expect(result.success).toBe(false);
      expect(result.errors?.general).toBe('Profile not found');
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('returns error when profile does not belong to the given user', async () => {
      mockFindUnique.mockResolvedValue({ status: 'APPROVED', userId: 'different-user' });

      const result = await resolveAllAndSuspend('user1', 'profile1', 'spam');

      expect(result.success).toBe(false);
      expect(result.errors?.general).toBe('Profile does not belong to this user');
      expect(mockTransaction).not.toHaveBeenCalled();
    });
  });

  describe('Success path', () => {
    const userId = 'user1';
    const profileId = 'profile1';
    const adminId = 'admin1';

    beforeEach(() => {
      mockVerify.mockResolvedValue({ authorized: true, userId: adminId, role: 'ADMIN' });
      mockFindUnique.mockResolvedValue({ status: 'APPROVED', userId });
      mockCount.mockResolvedValue(3);
      mockTransaction.mockResolvedValue([
        { count: 3 }, // report.updateMany
        { id: profileId, status: 'SUSPENDED' }, // profile.update
        { id: 'audit1' }, // moderationAuditLog.create
      ]);
    });

    it('returns success with correct message', async () => {
      const result = await resolveAllAndSuspend(userId, profileId, 'Multiple harassment reports');

      expect(result.success).toBe(true);
      expect(result.message).toBe('User suspended and 3 report(s) resolved');
    });

    it('queries the profile with correct id', async () => {
      await resolveAllAndSuspend(userId, profileId, 'reason');

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: profileId },
        select: { status: true, userId: true },
      });
    });

    it('counts open reports for the user before transacting', async () => {
      await resolveAllAndSuspend(userId, profileId, 'reason');

      expect(mockCount).toHaveBeenCalledWith({
        where: { reportedUserId: userId, status: { in: ['OPEN', 'REVIEWING'] } },
      });
    });

    it('runs a transaction with 3 operations', async () => {
      await resolveAllAndSuspend(userId, profileId, 'reason');

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      const txArgs = mockTransaction.mock.calls[0][0];
      expect(Array.isArray(txArgs)).toBe(true);
      expect(txArgs).toHaveLength(3);
    });
  });

  describe('Error handling', () => {
    it('returns failure when the transaction throws', async () => {
      mockVerify.mockResolvedValue({ authorized: true, userId: 'admin1', role: 'ADMIN' });
      mockFindUnique.mockResolvedValue({ status: 'APPROVED', userId: 'user1' });
      mockCount.mockResolvedValue(1);
      mockTransaction.mockRejectedValue(new Error('DB connection error'));

      const result = await resolveAllAndSuspend('user1', 'profile1', 'reason');

      expect(result.success).toBe(false);
      expect(result.errors?.general).toBe('Failed to suspend user');
    });
  });
});

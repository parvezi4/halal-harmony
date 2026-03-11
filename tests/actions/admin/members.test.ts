import {
  getMembers,
  getMemberStats,
  suspendMember,
  reactivateMember,
} from '@/app/actions/admin/members';
import { verifyAdminOrModerator } from '@/lib/admin/access';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    profile: {
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    subscription: {
      count: jest.fn(),
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

const mockVerifyAdminOrModerator = verifyAdminOrModerator as jest.Mock;

describe('Admin Members Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMembers', () => {
    it('should return unauthorized without session', async () => {
      mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

      const result = await getMembers();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized');
      }
    });

    it('should return unauthorized for filtered requests without session', async () => {
      mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

      const result = await getMembers({ search: 'test' });

      expect(result.success).toBe(false);
    });
  });

  describe('getMemberStats', () => {
    it('should return unauthorized without session', async () => {
      mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

      const result = await getMemberStats();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized');
      }
    });
  });

  describe('suspendMember', () => {
    it('should reject without session', async () => {
      mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

      const result = await suspendMember('user-1', 'Test suspension');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('should require a reason when authorized', async () => {
      mockVerifyAdminOrModerator.mockResolvedValue({ authorized: true, userId: 'admin-1', role: 'ADMIN' });

      const result = await suspendMember('user-1', '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Reason is required to suspend a member');
    });
  });

  describe('reactivateMember', () => {
    it('should reject without session', async () => {
      mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

      const result = await reactivateMember('user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });
  });
});

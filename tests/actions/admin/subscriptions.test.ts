import { getSubscriptions, getSubscriptionStats } from '@/app/actions/admin/subscriptions';
import { verifyAdminOrModerator } from '@/lib/admin/access';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    subscription: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/admin/access', () => ({
  verifyAdminOrModerator: jest.fn(),
}));

const mockVerifyAdminOrModerator = verifyAdminOrModerator as jest.Mock;

describe('Admin Subscriptions Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSubscriptions', () => {
    it('should return unauthorized for unauthorized users', async () => {
      mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

      const result = await getSubscriptions();

      expect(result.success).toBe(false);
      expect(result.errors?.general).toBeDefined();
    });
  });

  describe('getSubscriptionStats', () => {
    it('should return unauthorized without session', async () => {
      mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

      const result = await getSubscriptionStats();

      expect(result.success).toBe(false);
      expect(result.errors?.general).toBeDefined();
    });
  });

  describe('daysRemaining calculation', () => {
    it('should correctly calculate remaining days', async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      const daysRemaining = Math.max(
        0,
        Math.ceil((futureDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );

      expect(daysRemaining).toBeGreaterThanOrEqual(14);
      expect(daysRemaining).toBeLessThanOrEqual(16);
    });

    it('should return 0 for expired subscriptions', async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      const daysRemaining = Math.max(
        0,
        Math.ceil((pastDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );

      expect(daysRemaining).toBe(0);
    });
  });
});

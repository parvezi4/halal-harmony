import {
  getAuditLog,
  getAuditLogStats,
  getDistinctActors,
} from '@/app/actions/admin/audit-log';
import { verifyAdminOrModerator } from '@/lib/admin/access';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    moderationAuditLog: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/admin/access', () => ({
  verifyAdminOrModerator: jest.fn(),
}));

const mockVerifyAdminOrModerator = verifyAdminOrModerator as jest.Mock;

describe('Admin Audit Log Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return unauthorized for getAuditLog without session', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

    const result = await getAuditLog();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Unauthorized');
    }
  });

  it('should reject moderators from getAuditLog', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({ authorized: true, userId: 'mod-1', role: 'MODERATOR' });

    const result = await getAuditLog({ search: 'test' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Audit log is restricted to administrators');
    }
  });

  it('should return unauthorized for getAuditLogStats without session', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

    const result = await getAuditLogStats();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Unauthorized');
    }
  });

  it('should return unauthorized for getDistinctActors without session', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

    const result = await getDistinctActors();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Unauthorized');
    }
  });
});

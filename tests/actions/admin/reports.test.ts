import {
  getReports,
  getReportStats,
  updateReportStatus,
  getFlaggedUsers,
} from '@/app/actions/admin/reports';
import { verifyAdminOrModerator } from '@/lib/admin/access';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    report: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    profile: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    moderationAuditLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/admin/access', () => ({
  verifyAdminOrModerator: jest.fn(),
}));

const mockVerifyAdminOrModerator = verifyAdminOrModerator as jest.Mock;

describe('Admin Reports Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return unauthorized for getReports without session', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

    const result = await getReports();

    expect(result.success).toBe(false);
    expect(result.errors?.general).toBeDefined();
  });

  it('should return unauthorized for filtered getReports without session', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

    const result = await getReports({ status: 'OPEN' });

    expect(result.success).toBe(false);
  });

  it('should reject updateReportStatus without session', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

    const result = await updateReportStatus('report-1', 'REVIEWING');

    expect(result.success).toBe(false);
    expect(result.errors?.general).toBeDefined();
  });

  it('should reject getReportStats without session', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

    const result = await getReportStats();

    expect(result.success).toBe(false);
    expect(result.errors?.general).toBeDefined();
  });

  it('should reject getFlaggedUsers without session', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

    const result = await getFlaggedUsers();

    expect(result.success).toBe(false);
    expect(result.errors?.general).toBeDefined();
  });
});

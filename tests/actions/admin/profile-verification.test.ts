import {
  getPendingProfiles,
  approveProfile,
  suspendProfile,
  updateProfileRiskLabel,
  getProfileVerificationStats,
} from '@/app/actions/admin/profile-verification';
import { verifyAdminOrModerator } from '@/lib/admin/access';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    profile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
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

describe('Admin Profile Verification Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return unauthorized for getPendingProfiles without session', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

    const result = await getPendingProfiles();

    expect(result.success).toBe(false);
    expect(result.errors?.general).toBeDefined();
  });

  it('should return unauthorized for approveProfile without session', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

    const result = await approveProfile('profile-1', 'Test approval');

    expect(result.success).toBe(false);
    expect(result.errors?.general).toBeDefined();
  });

  it('should reject suspension without reason when authorized', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({ authorized: true, userId: 'admin-1', role: 'ADMIN' });

    const result = await suspendProfile('profile-1', '');

    expect(result.success).toBe(false);
    expect(result.errors?.general).toBe('Suspension reason is required');
  });

  it('should return unauthorized for updateProfileRiskLabel without session', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

    const result = await updateProfileRiskLabel('profile-1', 'RED', 'Suspicious activity');

    expect(result.success).toBe(false);
    expect(result.errors?.general).toBeDefined();
  });

  it('should return unauthorized for getProfileVerificationStats without session', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

    const result = await getProfileVerificationStats();

    expect(result.success).toBe(false);
    expect(result.errors?.general).toBeDefined();
  });
});

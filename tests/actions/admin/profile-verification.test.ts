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
  resolveModerationScopeGender: jest.fn((access) =>
    access.role === 'SUPERADMIN' ? null : (access.staffGender ?? null)
  ),
}));

const mockVerifyAdminOrModerator = verifyAdminOrModerator as jest.Mock;

describe('Admin Profile Verification Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return unauthorized for getPendingProfiles without session', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({
      authorized: false,
      userId: null,
      role: null,
      staffGender: null,
    });

    const result = await getPendingProfiles();

    expect(result.success).toBe(false);
    expect(result.errors?.general).toBeDefined();
  });

  it('should return unauthorized for approveProfile without session', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({
      authorized: false,
      userId: null,
      role: null,
      staffGender: null,
    });

    const result = await approveProfile('profile-1', 'Test approval');

    expect(result.success).toBe(false);
    expect(result.errors?.general).toBeDefined();
  });

  it('should reject suspension without reason when authorized', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({
      authorized: true,
      userId: 'admin-1',
      role: 'ADMIN',
      staffGender: 'MALE',
    });

    const result = await suspendProfile('profile-1', '');

    expect(result.success).toBe(false);
    expect(result.errors?.general).toBe('Suspension reason is required');
  });

  it('should return unauthorized for updateProfileRiskLabel without session', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({
      authorized: false,
      userId: null,
      role: null,
      staffGender: null,
    });

    const result = await updateProfileRiskLabel('profile-1', 'RED', 'Suspicious activity');

    expect(result.success).toBe(false);
    expect(result.errors?.general).toBeDefined();
  });

  it('should return unauthorized for getProfileVerificationStats without session', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({
      authorized: false,
      userId: null,
      role: null,
      staffGender: null,
    });

    const result = await getProfileVerificationStats();

    expect(result.success).toBe(false);
    expect(result.errors?.general).toBeDefined();
  });

  it('should scope pending profiles by staff gender for admin and moderator', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({
      authorized: true,
      userId: 'mod-1',
      role: 'MODERATOR',
      staffGender: 'MALE',
    });

    const { prisma } = jest.requireMock('@/lib/prisma') as {
      prisma: {
        profile: {
          count: jest.Mock;
          findMany: jest.Mock;
        };
      };
    };

    prisma.profile.count.mockResolvedValue(0);
    prisma.profile.findMany.mockResolvedValue([]);

    const result = await getPendingProfiles();

    expect(result.success).toBe(true);
    expect(prisma.profile.count).toHaveBeenCalledWith({
      where: {
        status: 'PENDING_REVIEW',
        gender: 'MALE',
      },
    });
  });
});

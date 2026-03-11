import {
  getPendingPhotos,
  approvePhoto,
  rejectPhoto,
  blurPhoto,
  getPhotoVerificationStats,
} from '@/app/actions/admin/photo-verification';
import { verifyAdminOrModerator } from '@/lib/admin/access';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    photo: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    moderationAuditLog: {
      create: jest.fn(),
    },
    profile: {
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/admin/access', () => ({
  verifyAdminOrModerator: jest.fn(),
}));

const mockVerifyAdminOrModerator = verifyAdminOrModerator as jest.Mock;

describe('Admin Photo Verification Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return unauthorized for getPendingPhotos without session', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

    const result = await getPendingPhotos();

    expect(result.success).toBe(false);
    expect(result.errors?.general).toBeDefined();
  });

  it('should return unauthorized for approvePhoto without session', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

    const result = await approvePhoto('photo-1', 'Test approval');

    expect(result.success).toBe(false);
    expect(result.errors?.general).toBeDefined();
  });

  it('should reject rejection without reason when authorized', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({ authorized: true, userId: 'admin-1', role: 'ADMIN' });

    const result = await rejectPhoto('photo-1', '');

    expect(result.success).toBe(false);
    expect(result.errors?.general).toBe('Rejection reason is required');
  });

  it('should return unauthorized for blurPhoto without session', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

    const result = await blurPhoto('photo-1', 'Test reason');

    expect(result.success).toBe(false);
    expect(result.errors?.general).toBeDefined();
  });

  it('should return unauthorized for getPhotoVerificationStats without session', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

    const result = await getPhotoVerificationStats();

    expect(result.success).toBe(false);
    expect(result.errors?.general).toBeDefined();
  });
});

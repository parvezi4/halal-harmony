import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  getPendingPhotos,
  approvePhoto,
  rejectPhoto,
  blurPhoto,
  getPhotoVerificationStats,
} from '@/app/actions/admin/photo-verification';
import { prisma } from '@/lib/prisma';

describe('Admin Photo Verification Actions', () => {
  let testUserId: string;
  let testProfileId: string;
  let testPhotoId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-photo-${Date.now()}@test.com`,
        passwordHash: 'hashed',
        role: 'ADMIN',
      },
    });
    testUserId = user.id;

    // Create test profile
    const profile = await prisma.profile.create({
      data: {
        userId: testUserId,
        gender: 'MALE',
        status: 'PENDING_REVIEW',
        riskLabel: 'GREEN',
      },
    });
    testProfileId = profile.id;

    // Create test photo
    const photo = await prisma.photo.create({
      data: {
        profileId: testProfileId,
        url: 'https://example.com/photo.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: 1024000,
        isApproved: false,
        isBlurred: true,
        isPrimary: false,
      },
    });
    testPhotoId = photo.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.photo.deleteMany({
      where: { profileId: testProfileId },
    });
    await prisma.profile.delete({
      where: { id: testProfileId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
  });

  describe('getPendingPhotos', () => {
    it('should return empty array for unauthorized users', async () => {
      const result = await getPendingPhotos();
      expect(result.success).toBe(false);
      expect(result.errors?.general).toBeDefined();
    });
  });

  describe('approvePhoto', () => {
    it('should return unauthorized response without session', async () => {
      const result = await approvePhoto(testPhotoId, 'Test approval');
      expect(result.success).toBe(false);
      expect(result.errors?.general).toBeDefined();
    });
  });

  describe('rejectPhoto', () => {
    it('should reject rejection without reason', async () => {
      const result = await rejectPhoto(testPhotoId, '');
      expect(result.success).toBe(false);
      expect(result.errors?.general).toBeDefined();
    });

    it('should return unauthorized response without session', async () => {
      const result = await rejectPhoto(testPhotoId, 'Test reason');
      expect(result.success).toBe(false);
      expect(result.errors?.general).toBeDefined();
    });
  });

  describe('blurPhoto', () => {
    it('should return unauthorized response without session', async () => {
      const result = await blurPhoto(testPhotoId, 'Test reason');
      expect(result.success).toBe(false);
      expect(result.errors?.general).toBeDefined();
    });
  });

  describe('getPhotoVerificationStats', () => {
    it('should return unauthorized response without session', async () => {
      const result = await getPhotoVerificationStats();
      expect(result.success).toBe(false);
      expect(result.errors?.general).toBeDefined();
    });
  });
});

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  getPendingProfiles,
  approveProfile,
  suspendProfile,
  updateProfileRiskLabel,
  getProfileVerificationStats,
} from '@/app/actions/admin/profile-verification';
import { prisma } from '@/lib/prisma';

describe('Admin Profile Verification Actions', () => {
  let testUserId: string;
  let testProfileId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-profile-${Date.now()}@test.com`,
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
  });

  afterAll(async () => {
    // Cleanup
    await prisma.profile.delete({
      where: { id: testProfileId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
  });

  describe('getPendingProfiles', () => {
    it('should return empty array for unauthorized users', async () => {
      const result = await getPendingProfiles();
      // This will fail authorization since we're not in a NextAuth session
      expect(result.success).toBe(false);
      expect(result.errors?.general).toBeDefined();
    });
  });

  describe('approveProfile', () => {
    it('should return unauthorized response without session', async () => {
      const result = await approveProfile(testProfileId, 'Test approval');
      expect(result.success).toBe(false);
      expect(result.errors?.general).toBeDefined();
    });
  });

  describe('suspendProfile', () => {
    it('should reject suspension without reason', async () => {
      const result = await suspendProfile(testProfileId, '');
      expect(result.success).toBe(false);
      expect(result.errors?.general).toBeDefined();
    });

    it('should return unauthorized response without session', async () => {
      const result = await suspendProfile(testProfileId, 'Test reason');
      expect(result.success).toBe(false);
      expect(result.errors?.general).toBeDefined();
    });
  });

  describe('updateProfileRiskLabel', () => {
    it('should return unauthorized response without session', async () => {
      const result = await updateProfileRiskLabel(testProfileId, 'RED', 'Suspicious activity');
      expect(result.success).toBe(false);
      expect(result.errors?.general).toBeDefined();
    });
  });

  describe('getProfileVerificationStats', () => {
    it('should return unauthorized response without session', async () => {
      const result = await getProfileVerificationStats();
      expect(result.success).toBe(false);
      expect(result.errors?.general).toBeDefined();
    });
  });
});

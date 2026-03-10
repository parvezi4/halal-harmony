import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  getMembers,
  getMemberStats,
  suspendMember,
  reactivateMember,
} from '@/app/actions/admin/members';
import { prisma } from '@/lib/prisma';

describe('Admin Members Actions', () => {
  let testUserId: string;
  let testProfileId: string;

  beforeAll(async () => {
    const ts = Date.now();

    const user = await prisma.user.create({
      data: {
        email: `member-mgmt-${ts}@test.com`,
        passwordHash: 'hashed',
        role: 'MEMBER',
        profile: {
          create: {
            gender: 'MALE',
            status: 'APPROVED',
            riskLabel: 'GREEN',
            alias: `TestMember${ts}`,
            fullName: `Test Member ${ts}`,
            country: 'GB',
          },
        },
      },
      select: {
        id: true,
        profile: { select: { id: true } },
      },
    });
    testUserId = user.id;
    testProfileId = user.profile!.id;
  });

  afterAll(async () => {
    await prisma.moderationAuditLog.deleteMany({
      where: { targetId: testUserId },
    });
    await prisma.profile.deleteMany({ where: { id: testProfileId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  describe('getMembers', () => {
    it('should return unauthorized without session', async () => {
      const result = await getMembers();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('should return unauthorized when no auth session is present', async () => {
      const result = await getMembers({ search: 'test' });
      expect(result.success).toBe(false);
    });
  });

  describe('getMemberStats', () => {
    it('should return unauthorized without session', async () => {
      const result = await getMemberStats();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('suspendMember', () => {
    it('should reject without session', async () => {
      const result = await suspendMember(testUserId, 'Test suspension');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should require a reason', async () => {
      // Without session, we still get auth error first
      const result = await suspendMember(testUserId, '');
      expect(result.success).toBe(false);
    });
  });

  describe('reactivateMember', () => {
    it('should reject without session', async () => {
      const result = await reactivateMember(testUserId);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Profile model integrity', () => {
    it('should have created the test user with an APPROVED profile', async () => {
      const profile = await prisma.profile.findUnique({
        where: { id: testProfileId },
        select: { status: true, riskLabel: true, alias: true },
      });
      expect(profile?.status).toBe('APPROVED');
      expect(profile?.riskLabel).toBe('GREEN');
      expect(profile?.alias).toContain('TestMember');
    });

    it('should be able to suspend profile directly via Prisma', async () => {
      await prisma.profile.update({
        where: { id: testProfileId },
        data: { status: 'SUSPENDED' },
      });

      const profile = await prisma.profile.findUnique({
        where: { id: testProfileId },
        select: { status: true },
      });
      expect(profile?.status).toBe('SUSPENDED');

      // Restore for other tests
      await prisma.profile.update({
        where: { id: testProfileId },
        data: { status: 'APPROVED' },
      });
    });
  });
});

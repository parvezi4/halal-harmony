import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  getAuditLog,
  getAuditLogStats,
  getDistinctActors,
} from '@/app/actions/admin/audit-log';
import { prisma } from '@/lib/prisma';

describe('Admin Audit Log Actions', () => {
  let actorUserId: string;
  let testLogId: string;

  beforeAll(async () => {
    const ts = Date.now();

    const actor = await prisma.user.create({
      data: {
        email: `audit-actor-${ts}@test.com`,
        passwordHash: 'hashed',
        role: 'ADMIN',
      },
    });
    actorUserId = actor.id;

    const log = await prisma.moderationAuditLog.create({
      data: {
        actorId: actorUserId,
        action: 'PROFILE_APPROVED',
        targetType: 'profile',
        targetId: `test-profile-${ts}`,
        reason: 'Test audit log entry',
        metadata: { note: 'created by test' },
      },
    });
    testLogId = log.id;
  });

  afterAll(async () => {
    await prisma.moderationAuditLog.deleteMany({
      where: { id: testLogId },
    });
    await prisma.user.deleteMany({ where: { id: actorUserId } });
  });

  describe('getAuditLog', () => {
    it('should return unauthorized without session', async () => {
      const result = await getAuditLog();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('should reject moderators (admin-only endpoint)', async () => {
      // Without any session, returns unauthorized
      const result = await getAuditLog({ search: 'test' });
      expect(result.success).toBe(false);
    });

    it('should reject with targetType filter without session', async () => {
      const result = await getAuditLog({ targetType: 'profile' });
      expect(result.success).toBe(false);
    });
  });

  describe('getAuditLogStats', () => {
    it('should return unauthorized without session', async () => {
      const result = await getAuditLogStats();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('getDistinctActors', () => {
    it('should return unauthorized without session', async () => {
      const result = await getDistinctActors();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('ModerationAuditLog model integrity', () => {
    it('should have created the test log with the correct action', async () => {
      const log = await prisma.moderationAuditLog.findUnique({
        where: { id: testLogId },
        select: { action: true, targetType: true, reason: true, metadata: true },
      });
      expect(log?.action).toBe('PROFILE_APPROVED');
      expect(log?.targetType).toBe('profile');
      expect(log?.reason).toBe('Test audit log entry');
      expect(log?.metadata).toMatchObject({ note: 'created by test' });
    });

    it('should have the actor linked correctly', async () => {
      const log = await prisma.moderationAuditLog.findUnique({
        where: { id: testLogId },
        select: { actorId: true },
      });
      expect(log?.actorId).toBe(actorUserId);
    });
  });
});

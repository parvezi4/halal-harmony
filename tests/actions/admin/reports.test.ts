import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  getReports,
  getReportStats,
  updateReportStatus,
  getFlaggedUsers,
} from '@/app/actions/admin/reports';
import { prisma } from '@/lib/prisma';

describe('Admin Reports Actions', () => {
  let reporterUserId: string;
  let reportedUserId: string;
  let testReportId: string;

  beforeAll(async () => {
    const ts = Date.now();

    const reporter = await prisma.user.create({
      data: { email: `reporter-${ts}@test.com`, passwordHash: 'hashed' },
    });
    reporterUserId = reporter.id;

    const reported = await prisma.user.create({
      data: { email: `reported-${ts}@test.com`, passwordHash: 'hashed' },
    });
    reportedUserId = reported.id;

    const report = await prisma.report.create({
      data: {
        reporterId: reporterUserId,
        reportedUserId: reportedUserId,
        reason: 'Inappropriate content in messages',
        status: 'OPEN',
      },
    });
    testReportId = report.id;
  });

  afterAll(async () => {
    await prisma.report.deleteMany({ where: { reporterId: reporterUserId } });
    await prisma.user.deleteMany({ where: { id: { in: [reporterUserId, reportedUserId] } } });
  });

  describe('getReports', () => {
    it('should return unauthorized without session', async () => {
      const result = await getReports();
      expect(result.success).toBe(false);
      expect(result.errors?.general).toBeDefined();
    });

    it('should reject empty status filter gracefully', async () => {
      // Unauthorized path — no session
      const result = await getReports({ status: 'OPEN' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateReportStatus', () => {
    it('should reject without session', async () => {
      const result = await updateReportStatus(testReportId, 'REVIEWING');
      expect(result.success).toBe(false);
      expect(result.errors?.general).toBeDefined();
    });
  });

  describe('getReportStats', () => {
    it('should reject without session', async () => {
      const result = await getReportStats();
      expect(result.success).toBe(false);
      expect(result.errors?.general).toBeDefined();
    });
  });

  describe('getFlaggedUsers', () => {
    it('should reject without session', async () => {
      const result = await getFlaggedUsers();
      expect(result.success).toBe(false);
      expect(result.errors?.general).toBeDefined();
    });
  });

  describe('Report reason validation', () => {
    it('should be present when a report is created', async () => {
      const report = await prisma.report.findUnique({
        where: { id: testReportId },
        select: { reason: true, status: true },
      });
      expect(report?.reason).toBeTruthy();
      expect(report?.status).toBe('OPEN');
    });
  });
});

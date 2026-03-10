import { prisma } from '@/lib/prisma';
import { verifyAdminOrModerator } from '@/lib/admin/access';
import {
  getModeratorPermissionConfig,
  updateModeratorPermissionConfig,
} from '@/app/actions/admin/permissions';

jest.mock('@/lib/admin/access', () => ({
  verifyAdminOrModerator: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    moderatorPermissionConfig: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    moderationAuditLog: {
      create: jest.fn(),
    },
  },
}));

const mockVerifyAdminOrModerator = verifyAdminOrModerator as jest.Mock;

describe('Admin Permission Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getModeratorPermissionConfig', () => {
    it('should deny non-admin users', async () => {
      mockVerifyAdminOrModerator.mockResolvedValue({
        authorized: false,
        userId: 'member1',
        role: 'MEMBER',
      });

      const result = await getModeratorPermissionConfig();

      expect(result.success).toBe(false);
      expect(result.errors?.general).toBe('Not authorized');
    });

    it('should return default config when no row exists', async () => {
      mockVerifyAdminOrModerator.mockResolvedValue({
        authorized: true,
        userId: 'admin1',
        role: 'ADMIN',
      });
      (prisma.moderatorPermissionConfig.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await getModeratorPermissionConfig();

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        canModerateMessages: true,
        canVerifyProfiles: true,
        canVerifyPhotos: true,
        canInspectSubscriptions: true,
        canManageReports: true,
        canUpdateRiskLabels: true,
      });
    });

    it('should return persisted config when available', async () => {
      mockVerifyAdminOrModerator.mockResolvedValue({
        authorized: true,
        userId: 'admin1',
        role: 'ADMIN',
      });
      (prisma.moderatorPermissionConfig.findFirst as jest.Mock).mockResolvedValue({
        canModerateMessages: true,
        canVerifyProfiles: false,
        canVerifyPhotos: true,
        canInspectSubscriptions: false,
        canManageReports: true,
        canUpdateRiskLabels: false,
        updatedAt: new Date('2026-03-10T00:00:00.000Z'),
      });

      const result = await getModeratorPermissionConfig();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        canModerateMessages: true,
        canVerifyProfiles: false,
        canVerifyPhotos: true,
        canInspectSubscriptions: false,
        canManageReports: true,
        canUpdateRiskLabels: false,
        updatedAt: '2026-03-10T00:00:00.000Z',
      });
    });
  });

  describe('updateModeratorPermissionConfig', () => {
    const payload = {
      canModerateMessages: true,
      canVerifyProfiles: true,
      canVerifyPhotos: false,
      canInspectSubscriptions: true,
      canManageReports: false,
      canUpdateRiskLabels: true,
    };

    it('should deny non-admin updates', async () => {
      mockVerifyAdminOrModerator.mockResolvedValue({
        authorized: false,
        userId: 'mod1',
        role: 'MODERATOR',
      });

      const result = await updateModeratorPermissionConfig(payload);

      expect(result.success).toBe(false);
      expect(result.errors?.general).toBe('Not authorized');
      expect(prisma.moderatorPermissionConfig.upsert).not.toHaveBeenCalled();
    });

    it('should upsert config and write audit log', async () => {
      mockVerifyAdminOrModerator.mockResolvedValue({
        authorized: true,
        userId: 'admin1',
        role: 'ADMIN',
      });
      (prisma.moderatorPermissionConfig.upsert as jest.Mock).mockResolvedValue({
        ...payload,
        updatedAt: new Date('2026-03-10T03:00:00.000Z'),
      });

      const result = await updateModeratorPermissionConfig(payload);

      expect(prisma.moderatorPermissionConfig.upsert).toHaveBeenCalledWith({
        where: { id: 'global-moderator-permissions' },
        create: {
          id: 'global-moderator-permissions',
          updatedById: 'admin1',
          ...payload,
        },
        update: {
          updatedById: 'admin1',
          ...payload,
        },
        select: {
          canModerateMessages: true,
          canVerifyProfiles: true,
          canVerifyPhotos: true,
          canInspectSubscriptions: true,
          canManageReports: true,
          canUpdateRiskLabels: true,
          updatedAt: true,
        },
      });

      expect(prisma.moderationAuditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 'admin1',
          action: 'UPDATE_MODERATOR_PERMISSIONS',
          targetType: 'ModeratorPermissionConfig',
          targetId: 'global-moderator-permissions',
          metadata: payload,
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        ...payload,
        updatedAt: '2026-03-10T03:00:00.000Z',
      });
    });
  });
});

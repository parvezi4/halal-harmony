'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyAdminOrModerator } from '@/lib/admin/access';
import { ADMIN_CAPABILITIES, type ModeratorCapabilityState } from '@/lib/admin/capabilities';

interface PermissionResponse {
  success: boolean;
  data?: ModeratorCapabilityState & { updatedAt: string };
  errors?: { general?: string };
}

const DEFAULT_CAPABILITIES: ModeratorCapabilityState = {
  canModerateMessages: true,
  canVerifyProfiles: true,
  canVerifyPhotos: true,
  canManageMembers: true,
  canInspectSubscriptions: true,
  canManageReports: true,
  canUpdateRiskLabels: true,
};

export async function getModeratorPermissionConfig(): Promise<PermissionResponse> {
  const { authorized } = await verifyAdminOrModerator(
    ADMIN_CAPABILITIES.MANAGE_MODERATOR_PERMISSIONS
  );

  if (!authorized) {
    return {
      success: false,
      errors: { general: 'Not authorized' },
    };
  }

  try {
    const config = await prisma.moderatorPermissionConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: {
        canModerateMessages: true,
        canVerifyProfiles: true,
        canVerifyPhotos: true,
        canManageMembers: true,
        canInspectSubscriptions: true,
        canManageReports: true,
        canUpdateRiskLabels: true,
        updatedAt: true,
      },
    });

    if (!config) {
      return {
        success: true,
        data: {
          ...DEFAULT_CAPABILITIES,
          updatedAt: new Date(0).toISOString(),
        },
      };
    }

    return {
      success: true,
      data: {
        canModerateMessages: config.canModerateMessages,
        canVerifyProfiles: config.canVerifyProfiles,
        canVerifyPhotos: config.canVerifyPhotos,
        canManageMembers: config.canManageMembers,
        canInspectSubscriptions: config.canInspectSubscriptions,
        canManageReports: config.canManageReports,
        canUpdateRiskLabels: config.canUpdateRiskLabels,
        updatedAt: config.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('Error fetching moderator permission config:', error);
    return {
      success: false,
      errors: { general: 'Failed to fetch moderator permissions' },
    };
  }
}

export async function updateModeratorPermissionConfig(
  payload: ModeratorCapabilityState
): Promise<PermissionResponse> {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.MANAGE_MODERATOR_PERMISSIONS);

  if (!access.authorized || !access.userId) {
    return {
      success: false,
      errors: { general: 'Not authorized' },
    };
  }

  try {
    const updatedConfig = await prisma.moderatorPermissionConfig.upsert({
      where: { id: 'global-moderator-permissions' },
      create: {
        id: 'global-moderator-permissions',
        updatedById: access.userId,
        ...payload,
      },
      update: {
        updatedById: access.userId,
        ...payload,
      },
      select: {
        canModerateMessages: true,
        canVerifyProfiles: true,
        canVerifyPhotos: true,
        canManageMembers: true,
        canInspectSubscriptions: true,
        canManageReports: true,
        canUpdateRiskLabels: true,
        updatedAt: true,
      },
    });

    await prisma.moderationAuditLog.create({
      data: {
        actorId: access.userId,
        action: 'UPDATE_MODERATOR_PERMISSIONS',
        targetType: 'ModeratorPermissionConfig',
        targetId: 'global-moderator-permissions',
        metadata: payload as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      success: true,
      data: {
        canModerateMessages: updatedConfig.canModerateMessages,
        canVerifyProfiles: updatedConfig.canVerifyProfiles,
        canVerifyPhotos: updatedConfig.canVerifyPhotos,
        canManageMembers: updatedConfig.canManageMembers,
        canInspectSubscriptions: updatedConfig.canInspectSubscriptions,
        canManageReports: updatedConfig.canManageReports,
        canUpdateRiskLabels: updatedConfig.canUpdateRiskLabels,
        updatedAt: updatedConfig.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('Error updating moderator permission config:', error);
    return {
      success: false,
      errors: { general: 'Failed to update moderator permissions' },
    };
  }
}

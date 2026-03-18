import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { Gender } from '@prisma/client';
import {
  capabilityAllowedByConfig,
  type AdminCapability,
  type ModeratorCapabilityState,
} from '@/lib/admin/capabilities';

interface AccessResult {
  authorized: boolean;
  userId: string | null;
  role: 'SUPERADMIN' | 'ADMIN' | 'MODERATOR' | 'MEMBER' | null;
  staffGender: Gender | null;
}

export function resolveModerationScopeGender(access: Pick<AccessResult, 'role' | 'staffGender'>) {
  if (access.role === 'SUPERADMIN') {
    return null;
  }

  if (access.role === 'ADMIN' || access.role === 'MODERATOR') {
    return access.staffGender;
  }

  return null;
}

export interface AdminFeatureAccess {
  canModerateMessages: boolean;
  canVerifyProfiles: boolean;
  canVerifyPhotos: boolean;
  canManageMembers: boolean;
  canInspectSubscriptions: boolean;
  canManageReports: boolean;
  canUpdateRiskLabels: boolean;
  canManageSettings: boolean;
  canViewAuditLog: boolean;
}

async function getModeratorCapabilityState(): Promise<ModeratorCapabilityState | null> {
  const config = await prisma.moderatorPermissionConfig.findUnique({
    where: { id: 'global-moderator-permissions' },
    select: {
      canModerateMessages: true,
      canVerifyProfiles: true,
      canVerifyPhotos: true,
      canManageMembers: true,
      canInspectSubscriptions: true,
      canManageReports: true,
      canUpdateRiskLabels: true,
    },
  });

  if (config) {
    return config;
  }

  const fallbackConfig = await prisma.moderatorPermissionConfig.findFirst({
    orderBy: { updatedAt: 'desc' },
    select: {
      canModerateMessages: true,
      canVerifyProfiles: true,
      canVerifyPhotos: true,
      canManageMembers: true,
      canInspectSubscriptions: true,
      canManageReports: true,
      canUpdateRiskLabels: true,
    },
  });

  if (!fallbackConfig) {
    return null;
  }

  return fallbackConfig;
}

function anyModeratorCapabilityEnabled(config: ModeratorCapabilityState) {
  return (
    config.canModerateMessages ||
    config.canVerifyProfiles ||
    config.canVerifyPhotos ||
    config.canManageMembers ||
    config.canInspectSubscriptions ||
    config.canManageReports ||
    config.canUpdateRiskLabels
  );
}

export async function getAdminFeatureAccess(): Promise<{
  userId: string | null;
  role: AccessResult['role'];
  features: AdminFeatureAccess;
}> {
  const access = await verifyAdminOrModerator();
  const disabled: AdminFeatureAccess = {
    canModerateMessages: false,
    canVerifyProfiles: false,
    canVerifyPhotos: false,
    canManageMembers: false,
    canInspectSubscriptions: false,
    canManageReports: false,
    canUpdateRiskLabels: false,
    canManageSettings: false,
    canViewAuditLog: false,
  };

  if (!access.userId || !access.authorized || !access.role) {
    return { userId: access.userId, role: access.role, features: disabled };
  }

  if (access.role === 'SUPERADMIN' || access.role === 'ADMIN') {
    return {
      userId: access.userId,
      role: access.role,
      features: {
        canModerateMessages: true,
        canVerifyProfiles: true,
        canVerifyPhotos: true,
        canManageMembers: true,
        canInspectSubscriptions: true,
        canManageReports: true,
        canUpdateRiskLabels: true,
        canManageSettings: true,
        canViewAuditLog: true,
      },
    };
  }

  const moderatorConfig = await getModeratorCapabilityState();
  if (!moderatorConfig) {
    return { userId: access.userId, role: access.role, features: disabled };
  }

  return {
    userId: access.userId,
    role: access.role,
    features: {
      canModerateMessages: moderatorConfig.canModerateMessages,
      canVerifyProfiles: moderatorConfig.canVerifyProfiles,
      canVerifyPhotos: moderatorConfig.canVerifyPhotos,
      canManageMembers: moderatorConfig.canManageMembers,
      canInspectSubscriptions: moderatorConfig.canInspectSubscriptions,
      canManageReports: moderatorConfig.canManageReports,
      canUpdateRiskLabels: moderatorConfig.canUpdateRiskLabels,
      canManageSettings: false,
      canViewAuditLog: false,
    },
  };
}

export async function verifyAdminOrModerator(
  capability?: AdminCapability
): Promise<AccessResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { authorized: false, userId: null, role: null, staffGender: null };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      adminAccount: {
        select: {
          gender: true,
        },
      },
    },
  });

  if (!user) {
    return { authorized: false, userId: null, role: null, staffGender: null };
  }

  const staffGender = user.adminAccount?.gender ?? null;

  if (user.role === 'SUPERADMIN') {
    return { authorized: true, userId: session.user.id, role: 'SUPERADMIN', staffGender };
  }

  if (user.role === 'ADMIN') {
    return { authorized: Boolean(staffGender), userId: session.user.id, role: 'ADMIN', staffGender };
  }

  if (user.role !== 'MODERATOR') {
    return { authorized: false, userId: session.user.id, role: 'MEMBER', staffGender: null };
  }

  const moderatorConfig = await getModeratorCapabilityState();
  if (!moderatorConfig) {
    return {
      authorized: false,
      userId: session.user.id,
      role: 'MODERATOR',
      staffGender,
    };
  }

  if (!staffGender) {
    return {
      authorized: false,
      userId: session.user.id,
      role: 'MODERATOR',
      staffGender: null,
    };
  }

  if (!capability) {
    return {
      authorized: anyModeratorCapabilityEnabled(moderatorConfig),
      userId: session.user.id,
      role: 'MODERATOR',
      staffGender,
    };
  }

  return {
    authorized: capabilityAllowedByConfig(capability, moderatorConfig),
    userId: session.user.id,
    role: 'MODERATOR',
    staffGender,
  };
}

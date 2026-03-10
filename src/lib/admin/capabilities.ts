export const ADMIN_CAPABILITIES = {
  MODERATE_MESSAGES: 'moderate_messages',
  VERIFY_PROFILES: 'verify_profiles',
  VERIFY_PHOTOS: 'verify_photos',
  INSPECT_SUBSCRIPTIONS: 'inspect_subscriptions',
  MANAGE_REPORTS: 'manage_reports',
  UPDATE_RISK_LABELS: 'update_risk_labels',
  MANAGE_MODERATOR_PERMISSIONS: 'manage_moderator_permissions',
} as const;

export type AdminCapability =
  (typeof ADMIN_CAPABILITIES)[keyof typeof ADMIN_CAPABILITIES];

export interface ModeratorCapabilityState {
  canModerateMessages: boolean;
  canVerifyProfiles: boolean;
  canVerifyPhotos: boolean;
  canInspectSubscriptions: boolean;
  canManageReports: boolean;
  canUpdateRiskLabels: boolean;
}

export function capabilityAllowedByConfig(
  capability: AdminCapability,
  config: ModeratorCapabilityState
): boolean {
  switch (capability) {
    case ADMIN_CAPABILITIES.MODERATE_MESSAGES:
      return config.canModerateMessages;
    case ADMIN_CAPABILITIES.VERIFY_PROFILES:
      return config.canVerifyProfiles;
    case ADMIN_CAPABILITIES.VERIFY_PHOTOS:
      return config.canVerifyPhotos;
    case ADMIN_CAPABILITIES.INSPECT_SUBSCRIPTIONS:
      return config.canInspectSubscriptions;
    case ADMIN_CAPABILITIES.MANAGE_REPORTS:
      return config.canManageReports;
    case ADMIN_CAPABILITIES.UPDATE_RISK_LABELS:
      return config.canUpdateRiskLabels;
    case ADMIN_CAPABILITIES.MANAGE_MODERATOR_PERMISSIONS:
      return false;
    default:
      return false;
  }
}

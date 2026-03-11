'use server';

import { prisma } from '@/lib/prisma';
import { verifyAdminOrModerator } from '@/lib/admin/access';
import { ADMIN_CAPABILITIES } from '@/lib/admin/capabilities';

/**
 * Resolves all open/reviewing reports for a user and suspends their profile
 * in a single transaction. Requires VERIFY_PROFILES capability.
 */
export async function resolveAllAndSuspend(
  userId: string,
  profileId: string,
  reason: string
): Promise<{ success: boolean; message?: string; errors?: { general?: string } }> {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.VERIFY_PROFILES);

  if (!access.authorized || !access.userId) {
    return { success: false, errors: { general: 'Not authorized' } };
  }

  if (!reason?.trim()) {
    return { success: false, errors: { general: 'Reason is required' } };
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { status: true, userId: true },
    });

    if (!profile) {
      return { success: false, errors: { general: 'Profile not found' } };
    }

    if (profile.userId !== userId) {
      return { success: false, errors: { general: 'Profile does not belong to this user' } };
    }

    // Count open reports before resolving so we can include it in the audit log
    const openReportCount = await prisma.report.count({
      where: { reportedUserId: userId, status: { in: ['OPEN', 'REVIEWING'] } },
    });

    await prisma.$transaction([
      // Resolve all open/reviewing reports for this user
      prisma.report.updateMany({
        where: { reportedUserId: userId, status: { in: ['OPEN', 'REVIEWING'] } },
        data: { status: 'RESOLVED' },
      }),
      // Suspend the profile
      prisma.profile.update({
        where: { id: profileId },
        data: { status: 'SUSPENDED' },
      }),
      // Single audit log entry covering both actions
      prisma.moderationAuditLog.create({
        data: {
          actorId: access.userId,
          action: 'RESOLVE_ALL_AND_SUSPEND',
          targetType: 'user',
          targetId: userId,
          reason,
          metadata: {
            profileId,
            resolvedReportCount: openReportCount,
            previousProfileStatus: profile.status,
          },
        },
      }),
    ]);

    return {
      success: true,
      message: `User suspended and ${openReportCount} report(s) resolved`,
    };
  } catch (error) {
    console.error('Error in resolveAllAndSuspend:', error);
    return { success: false, errors: { general: 'Failed to suspend user' } };
  }
}

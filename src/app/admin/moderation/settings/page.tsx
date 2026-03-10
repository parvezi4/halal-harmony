import { redirect } from 'next/navigation';
import { verifyAdminOrModerator } from '@/lib/admin/access';
import ModerationSettingsClient from './ModerationSettingsClient';
import { getModeratorPermissionConfig } from '@/app/actions/admin/permissions';

export default async function ModerationSettingsPage() {
  const access = await verifyAdminOrModerator();

  if (!access.userId) {
    redirect('/auth/login');
  }

  if (access.role !== 'ADMIN') {
    redirect('/admin/moderation');
  }

  const permissionResult = await getModeratorPermissionConfig();
  if (!permissionResult.success || !permissionResult.data) {
    return (
      <div className="rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-200">
        Failed to load moderator permission settings.
      </div>
    );
  }

  return <ModerationSettingsClient initialPermissions={permissionResult.data} />;
}

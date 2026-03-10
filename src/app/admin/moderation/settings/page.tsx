import { redirect } from 'next/navigation';
import { verifyAdminOrModerator } from '@/lib/admin/access';
import ModerationSettingsClient from './ModerationSettingsClient';

export default async function ModerationSettingsPage() {
  const access = await verifyAdminOrModerator();

  if (!access.userId) {
    redirect('/auth/login');
  }

  if (access.role !== 'ADMIN') {
    redirect('/admin/moderation');
  }

  return <ModerationSettingsClient />;
}

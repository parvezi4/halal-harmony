import { verifyAdminOrModerator } from '@/lib/admin/access';
import { redirect } from 'next/navigation';
import { FlaggedUsersClient } from './FlaggedUsersClient';
import { ADMIN_CAPABILITIES } from '@/lib/admin/capabilities';

export default async function FlaggedUsersPage() {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.MANAGE_REPORTS);

  if (!access.userId) redirect('/admin/login');
  if (!access.authorized) redirect('/admin');

  return <FlaggedUsersClient />;
}

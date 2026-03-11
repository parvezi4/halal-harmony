import { verifyAdminOrModerator } from '@/lib/admin/access';
import { redirect } from 'next/navigation';
import { FlaggedUsersClient } from './FlaggedUsersClient';

export default async function FlaggedUsersPage() {
  const access = await verifyAdminOrModerator();

  if (!access.userId) redirect('/admin/login');
  if (!access.authorized) redirect('/dashboard');

  return <FlaggedUsersClient />;
}

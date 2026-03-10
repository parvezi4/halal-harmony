import { verifyAdminOrModerator } from '@/lib/admin/access';
import { redirect } from 'next/navigation';
import MembersClient from './MembersClient';

export default async function MembersPage() {
  const access = await verifyAdminOrModerator();

  if (!access.userId) redirect('/auth/login');
  if (!access.authorized) redirect('/dashboard');

  return <MembersClient />;
}

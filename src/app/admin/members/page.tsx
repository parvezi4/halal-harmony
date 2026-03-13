import { verifyAdminOrModerator } from '@/lib/admin/access';
import { ADMIN_CAPABILITIES } from '@/lib/admin/capabilities';
import { redirect } from 'next/navigation';
import MembersClient from './MembersClient';

export default async function MembersPage() {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.MANAGE_MEMBERS);

  if (!access.userId) redirect('/admin/login');
  if (!access.authorized) redirect('/admin');

  return <MembersClient />;
}

import { redirect } from 'next/navigation';
import { ReportsClient } from './ReportsClient';
import { verifyAdminOrModerator } from '@/lib/admin/access';
import { ADMIN_CAPABILITIES } from '@/lib/admin/capabilities';

export default async function ReportsPage() {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.MANAGE_REPORTS);

  if (!access.userId) redirect('/admin/login');
  if (!access.authorized) redirect('/admin');

  return <ReportsClient />;
}

import { redirect } from 'next/navigation';
import { verifyAdminOrModerator } from '@/lib/admin/access';
import { ADMIN_CAPABILITIES } from '@/lib/admin/capabilities';
import { AdminPaymentsClient } from './AdminPaymentsClient';

export default async function AdminPaymentsPage() {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.INSPECT_SUBSCRIPTIONS);

  if (!access.authorized) {
    redirect('/admin');
  }

  return <AdminPaymentsClient />;
}

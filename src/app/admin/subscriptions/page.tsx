import { redirect } from 'next/navigation';
import { SubscriptionsClient } from './SubscriptionsClient';
import { verifyAdminOrModerator } from '@/lib/admin/access';
import { ADMIN_CAPABILITIES } from '@/lib/admin/capabilities';

export default async function SubscriptionsPage() {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.INSPECT_SUBSCRIPTIONS);

  if (!access.userId) redirect('/admin/login');
  if (!access.authorized) redirect('/admin');

  return <SubscriptionsClient />;
}

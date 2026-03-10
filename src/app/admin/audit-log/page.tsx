import { verifyAdminOrModerator } from '@/lib/admin/access';
import { redirect } from 'next/navigation';
import AuditLogClient from './AuditLogClient';

export default async function AuditLogPage() {
  const access = await verifyAdminOrModerator();

  if (!access.userId) redirect('/auth/login');
  if (!access.authorized) redirect('/dashboard');
  // Admin-only page — moderators see a message from the client action
  if (access.role !== 'ADMIN') redirect('/admin/moderation');

  return <AuditLogClient />;
}

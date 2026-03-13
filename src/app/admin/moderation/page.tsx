import { redirect } from 'next/navigation';
import { getPendingMessages, getModerationStats } from '@/app/actions/admin/moderation';
import { ModerationQueueClient } from './ModerationQueueClient';
import { verifyAdminOrModerator } from '@/lib/admin/access';
import { ADMIN_CAPABILITIES } from '@/lib/admin/capabilities';

export default async function ModerationPage() {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.MODERATE_MESSAGES);

  if (!access.userId) redirect('/admin/login');
  if (!access.authorized) redirect('/admin');

  const [pendingResult, statsResult] = await Promise.all([
    getPendingMessages(),
    getModerationStats(),
  ]);

  const pendingMessages = pendingResult.success && pendingResult.data ? pendingResult.data : [];
  const stats = statsResult.success && statsResult.data ? statsResult.data : null;

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
          Content Moderation Queue
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Review flagged messages before they are delivered to recipients
        </p>
      </header>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs text-slate-400">Pending Review</p>
            <p className="mt-1 text-2xl font-bold text-amber-400">{stats.pending}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs text-slate-400">Total Approved</p>
            <p className="mt-1 text-2xl font-bold text-green-400">{stats.approved}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs text-slate-400">Total Rejected</p>
            <p className="mt-1 text-2xl font-bold text-red-400">{stats.rejected}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs text-slate-400">Total Flagged</p>
            <p className="mt-1 text-2xl font-bold text-slate-300">{stats.totalFlagged}</p>
          </div>
        </div>
      )}

      <ModerationQueueClient initialMessages={pendingMessages} />
    </div>
  );
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { verifyAdminOrModerator } from '@/lib/admin/access';
import { ADMIN_CAPABILITIES } from '@/lib/admin/capabilities';

const placeholderLogs = [
  {
    id: 'placeholder-1',
    member: 'fatima@example.com',
    issueType: 'PAYMENT_FAILED',
    reason: 'BANK_DECLINE',
    status: 'Pending follow-up',
    createdAt: 'Placeholder',
  },
  {
    id: 'placeholder-2',
    member: 'ahmed@example.com',
    issueType: 'SUBSCRIPTION_CONFIRMED',
    reason: 'N/A',
    status: 'Notification queued',
    createdAt: 'Placeholder',
  },
] as const;

export default async function AdminPaymentsPage() {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.INSPECT_SUBSCRIPTIONS);

  if (!access.authorized) {
    redirect('/admin');
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-bold text-slate-50">Payments Operations</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Placeholder operations surface for refunds, payment investigations, and customer communication
          history. Full transactional controls will be enabled in a later implementation slice.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <h2 className="text-sm font-semibold text-slate-50">Refund queue</h2>
          <p className="mt-2 text-xs text-slate-400">Manual refund workflow placeholder</p>
          <button
            type="button"
            disabled
            className="mt-3 rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-400"
          >
            Open refunds (soon)
          </button>
        </article>

        <article className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <h2 className="text-sm font-semibold text-slate-50">Payment issue triage</h2>
          <p className="mt-2 text-xs text-slate-400">Classify failures by bank, processor, or server side</p>
          <button
            type="button"
            disabled
            className="mt-3 rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-400"
          >
            Investigate issues (soon)
          </button>
        </article>

        <article className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <h2 className="text-sm font-semibold text-slate-50">Customer communication</h2>
          <p className="mt-2 text-xs text-slate-400">Track admin outreach based on payment logs</p>
          <button
            type="button"
            disabled
            className="mt-3 rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-400"
          >
            Send update (soon)
          </button>
        </article>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-50">Communication log placeholders</h2>
          <Link href="/admin/subscriptions" className="text-xs font-semibold text-accent-200 hover:text-accent-100">
            Back to subscriptions →
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-xs text-slate-300 sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 pr-4 font-medium">Member</th>
                <th className="py-2 pr-4 font-medium">Event</th>
                <th className="py-2 pr-4 font-medium">Reason</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {placeholderLogs.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-900/80">
                  <td className="py-2 pr-4">{entry.member}</td>
                  <td className="py-2 pr-4">{entry.issueType}</td>
                  <td className="py-2 pr-4">{entry.reason}</td>
                  <td className="py-2 pr-4">{entry.status}</td>
                  <td className="py-2 pr-4 text-slate-400">{entry.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

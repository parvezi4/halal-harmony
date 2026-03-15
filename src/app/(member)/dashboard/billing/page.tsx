import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';

function formatDate(value: Date) {
  return value.toLocaleDateString('en-GB', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function MemberBillingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: session.user.id },
    include: {
      plan: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  });

  const current = subscriptions[0];

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-300">Billing</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-50">Subscription and payments</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Manage your membership status, review invoices, and handle payment issues in one place.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-sm font-semibold text-slate-50">Current plan</h2>
          {!current && (
            <p className="mt-3 text-sm text-slate-300">
              You are currently on the free member plan.
            </p>
          )}
          {current && (
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p>
                <span className="text-slate-400">Status:</span>{' '}
                <span className="font-semibold text-accent-200">{current.status}</span>
              </p>
              <p>
                <span className="text-slate-400">Plan:</span>{' '}
                {current.plan?.name || 'Premium'}
              </p>
              <p>
                <span className="text-slate-400">Start date:</span> {formatDate(current.startDate)}
              </p>
              <p>
                <span className="text-slate-400">End date:</span> {formatDate(current.endDate)}
              </p>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/pricing"
              className="rounded-full bg-accent-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-accent-400"
            >
              {current ? 'Change plan' : 'Upgrade to Premium'}
            </Link>
            <button
              type="button"
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200"
              disabled
              title="Cancellation API will be enabled in the next implementation slice"
            >
              Cancel auto-renew (soon)
            </button>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-sm font-semibold text-slate-50">Communication preferences</h2>
          <p className="mt-2 text-sm text-slate-300">
            We are preparing automatic payment notifications for successful renewals and failures.
          </p>
          <ul className="mt-3 space-y-1 text-xs text-slate-400">
            <li>• Subscription confirmation emails (placeholder wired)</li>
            <li>• Payment failure alerts with reason category (placeholder wired)</li>
            <li>• Admin follow-up communication log (placeholder wired)</li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Outbound email delivery is not enabled in this release yet.
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-sm font-semibold text-slate-50">Recent billing history</h2>
        {subscriptions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-300">No billing records yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-300 sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 pr-4 font-medium">Plan</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Start</th>
                  <th className="py-2 pr-4 font-medium">End</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((item) => (
                  <tr key={item.id} className="border-b border-slate-900/80">
                    <td className="py-2 pr-4">{item.plan?.name || 'Premium'}</td>
                    <td className="py-2 pr-4">{item.status}</td>
                    <td className="py-2 pr-4">{formatDate(item.startDate)}</td>
                    <td className="py-2 pr-4">{formatDate(item.endDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

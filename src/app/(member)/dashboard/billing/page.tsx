"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

function formatDate(value: Date) {
  return value.toLocaleDateString('en-GB', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

type BillingHistoryPayload = {
  success: boolean;
  errors?: Record<string, string>;
  data?: {
    currentSubscription: {
      id: string;
      status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
      startDate: string;
      endDate: string;
      planName: string | null;
      stripeSubscriptionId: string | null;
      stripeCustomerId: string | null;
    } | null;
    invoices: Array<{
      id: string;
      amountDue: number;
      amountPaid: number;
      currency: string;
      status: string | null;
      createdAt: string;
      hostedInvoiceUrl: string | null;
      invoicePdfUrl: string | null;
    }>;
  };
};

type CancelResponse = {
  success: boolean;
  errors?: Record<string, string>;
  data?: {
    subscriptionId: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string;
  };
};

function formatMinorUnits(value: number, currency: string) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(value / 100);
}

export default function MemberBillingPage() {
  const [loading, setLoading] = useState(true);
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<BillingHistoryPayload['data'] | null>(null);

  async function loadBillingHistory() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/billing-history?limit=10', {
        method: 'GET',
      });
      const payload = (await response.json()) as BillingHistoryPayload;

      if (!response.ok || !payload.success || !payload.data) {
        setError(payload.errors?.general || 'Failed to load billing history');
        setHistory(null);
        return;
      }

      setHistory(payload.data);
    } catch {
      setError('Failed to load billing history');
      setHistory(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBillingHistory();
  }, []);

  const current = history?.currentSubscription || null;
  const invoices = history?.invoices || [];
  const canCancel = Boolean(current?.status === 'ACTIVE' && current?.stripeSubscriptionId);

  const cancellationCopy = useMemo(() => {
    if (!current) {
      return 'No active subscription to cancel right now.';
    }

    if (current.status !== 'ACTIVE') {
      return 'Only active subscriptions can be set to cancel at period end.';
    }

    return 'Cancellation will stop auto-renew and access continues until the end date.';
  }, [current]);

  async function handleCancelAutoRenew() {
    if (!canCancel) {
      return;
    }

    setSubmittingCancel(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/cancel', {
        method: 'POST',
      });
      const payload = (await response.json()) as CancelResponse;

      if (!response.ok || !payload.success) {
        setError(payload.errors?.general || 'Failed to cancel auto-renew');
        return;
      }

      await loadBillingHistory();
    } catch {
      setError('Failed to cancel auto-renew');
    } finally {
      setSubmittingCancel(false);
    }
  }

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
          {loading && <p className="mt-3 text-sm text-slate-300">Loading billing details...</p>}
          {!loading && error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          {!current && (
            <p className="mt-3 text-sm text-slate-300">
              You are currently on the free member plan.
            </p>
          )}
          {!loading && !error && current && (
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p>
                <span className="text-slate-400">Status:</span>{' '}
                <span className="font-semibold text-accent-200">{current.status}</span>
              </p>
              <p>
                <span className="text-slate-400">Plan:</span> {current.planName || 'Premium'}
              </p>
              <p>
                <span className="text-slate-400">Start date:</span>{' '}
                {formatDate(new Date(current.startDate))}
              </p>
              <p>
                <span className="text-slate-400">End date:</span>{' '}
                {formatDate(new Date(current.endDate))}
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
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canCancel || submittingCancel}
              onClick={() => {
                void handleCancelAutoRenew();
              }}
            >
              {submittingCancel ? 'Cancelling...' : 'Cancel auto-renew'}
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">{cancellationCopy}</p>
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
        {loading ? (
          <p className="mt-3 text-sm text-slate-300">Loading invoices...</p>
        ) : invoices.length === 0 ? (
          <p className="mt-3 text-sm text-slate-300">No billing records yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-300 sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 pr-4 font-medium">Invoice</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Amount</th>
                  <th className="py-2 pr-4 font-medium">Created</th>
                  <th className="py-2 pr-4 font-medium">Links</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((item) => (
                  <tr key={item.id} className="border-b border-slate-900/80">
                    <td className="py-2 pr-4">{item.id}</td>
                    <td className="py-2 pr-4">{item.status || 'unknown'}</td>
                    <td className="py-2 pr-4">
                      {formatMinorUnits(item.amountPaid || item.amountDue, item.currency)}
                    </td>
                    <td className="py-2 pr-4">{formatDate(new Date(item.createdAt))}</td>
                    <td className="py-2 pr-4">
                      {item.hostedInvoiceUrl ? (
                        <a
                          href={item.hostedInvoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent-200 hover:text-accent-100"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </td>
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

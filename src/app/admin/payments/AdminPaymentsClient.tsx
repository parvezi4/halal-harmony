'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  createPaymentCommunicationLog,
  getPaymentCommunicationLogs,
  type PaymentCommunicationInput,
  type PaymentCommunicationLog,
} from '@/app/actions/admin/payments';
import { PAYMENT_COMMUNICATION_OPTIONS } from '@/lib/payments/communication-options';

const EVENT_LABELS: Record<string, string> = {
  PAYMENT_FAILED: 'Payment failed',
  PAYMENT_RECOVERED: 'Payment recovered',
  SUBSCRIPTION_CONFIRMED: 'Subscription confirmed',
  SUBSCRIPTION_CANCELLED: 'Subscription cancelled',
  ADMIN_OUTREACH: 'Admin outreach',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_FOLLOW_UP: 'Pending follow-up',
  RESOLVED: 'Resolved',
  NOT_REQUIRED: 'Not required',
};

export function AdminPaymentsClient() {
  const [logs, setLogs] = useState<PaymentCommunicationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<PaymentCommunicationInput>({
    memberEmail: '',
    eventType: PAYMENT_COMMUNICATION_OPTIONS.eventTypes[0],
    reason: '',
    status: PAYMENT_COMMUNICATION_OPTIONS.statuses[0],
    note: '',
  });

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    setError(null);

    const result = await getPaymentCommunicationLogs();
    if (!result.success) {
      setError(result.error);
      setLoadingLogs(false);
      return;
    }

    setLogs(result.data);
    setLoadingLogs(false);
  }, []);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const result = await createPaymentCommunicationLog(form);

    if (!result.success) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setSuccess(result.message);
    setForm({
      memberEmail: '',
      eventType: PAYMENT_COMMUNICATION_OPTIONS.eventTypes[0],
      reason: '',
      status: PAYMENT_COMMUNICATION_OPTIONS.statuses[0],
      note: '',
    });

    await loadLogs();
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-bold text-slate-50">Payments Operations</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Track payment-related member communications in one place. This is the first operational
          slice for payment outreach history.
        </p>
      </header>

      <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-50">Log payment communication</h2>
          <Link href="/admin/subscriptions" className="text-xs font-semibold text-accent-200 hover:text-accent-100">
            Back to subscriptions →
          </Link>
        </div>

        <form onSubmit={onSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-slate-400">Member email</span>
            <input
              type="email"
              value={form.memberEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, memberEmail: e.target.value }))}
              placeholder="member@example.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:border-accent-500 focus:outline-none"
              required
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs text-slate-400">Event type</span>
            <select
              value={form.eventType}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  eventType: e.target.value as PaymentCommunicationInput['eventType'],
                }))
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:border-accent-500 focus:outline-none"
            >
              {PAYMENT_COMMUNICATION_OPTIONS.eventTypes.map((value) => (
                <option key={value} value={value}>
                  {EVENT_LABELS[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs text-slate-400">Reason</span>
            <input
              type="text"
              value={form.reason}
              onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="BANK_DECLINE, PROCESSOR_RETRYABLE, etc"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:border-accent-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs text-slate-400">Status</span>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status: e.target.value as PaymentCommunicationInput['status'],
                }))
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:border-accent-500 focus:outline-none"
            >
              {PAYMENT_COMMUNICATION_OPTIONS.statuses.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-xs text-slate-400">Admin note</span>
            <textarea
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              rows={3}
              placeholder="Optional note about outreach or next actions"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:border-accent-500 focus:outline-none"
            />
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-accent-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Save communication log'}
            </button>
          </div>
        </form>

        {error ? (
          <p className="mt-3 rounded-md border border-red-800 bg-red-900/30 px-3 py-2 text-xs text-red-200">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="mt-3 rounded-md border border-green-800 bg-green-900/20 px-3 py-2 text-xs text-green-200">
            {success}
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <h2 className="text-sm font-semibold text-slate-50">Payment communication log</h2>
        <p className="mt-1 text-xs text-slate-400">
          Newest entries are shown first and can be used as an outreach timeline for payment issues.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-xs text-slate-300 sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 pr-4 font-medium">Member</th>
                <th className="py-2 pr-4 font-medium">Event</th>
                <th className="py-2 pr-4 font-medium">Reason</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Note</th>
                <th className="py-2 pr-4 font-medium">Actor</th>
                <th className="py-2 pr-4 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {loadingLogs ? (
                <tr>
                  <td className="py-3 pr-4 text-slate-400" colSpan={7}>
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td className="py-3 pr-4 text-slate-400" colSpan={7}>
                    No payment communication logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-900/80 align-top">
                    <td className="py-2 pr-4">{entry.memberEmail}</td>
                    <td className="py-2 pr-4">{EVENT_LABELS[entry.eventType] ?? entry.eventType}</td>
                    <td className="py-2 pr-4">{entry.reason}</td>
                    <td className="py-2 pr-4">{STATUS_LABELS[entry.status] ?? entry.status}</td>
                    <td className="py-2 pr-4">{entry.note || 'N/A'}</td>
                    <td className="py-2 pr-4 text-slate-400">{entry.actorEmail}</td>
                    <td className="py-2 pr-4 text-slate-400">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

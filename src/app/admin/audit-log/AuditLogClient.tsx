'use client';

import { useState, useCallback } from 'react';
import {
  getAuditLog,
  getAuditLogStats,
  getDistinctActors,
  type AuditLogFilters,
  type AuditLogEntry,
  type AuditLogStats,
} from '@/app/actions/admin/audit-log';

const ACTION_STYLES: Record<string, string> = {
  PROFILE_APPROVED: 'bg-green-900/50 text-green-300',
  PROFILE_SUSPENDED: 'bg-red-900/50 text-red-300',
  MEMBER_SUSPENDED: 'bg-red-900/50 text-red-300',
  MEMBER_REACTIVATED: 'bg-green-900/50 text-green-300',
  PHOTO_APPROVED: 'bg-green-900/50 text-green-300',
  PHOTO_REJECTED: 'bg-red-900/50 text-red-300',
  PHOTO_BLURRED: 'bg-amber-900/50 text-amber-300',
  REPORT_STATUS_UPDATED: 'bg-sky-900/50 text-sky-300',
  RISK_LABEL_UPDATED: 'bg-purple-900/50 text-purple-300',
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  profile: 'Profile',
  user: 'User',
  photo: 'Photo',
  report: 'Report',
  message: 'Message',
};

function actionBadge(action: string) {
  const style = ACTION_STYLES[action] ?? 'bg-slate-800 text-slate-300';
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${style}`}>
      {action.replace(/_/g, ' ')}
    </span>
  );
}

export default function AuditLogClient() {
  const [filters, setFilters] = useState<AuditLogFilters>({
    search: '',
    actorId: '',
    targetType: '',
    action: '',
    page: 1,
    pageSize: 25,
  });
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [actors, setActors] = useState<{ id: string; email: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(
    async (overrideFilters?: Partial<AuditLogFilters>) => {
      setLoading(true);
      setError(null);
      const active = { ...filters, ...overrideFilters };
      const [logsRes, statsRes, actorsRes] = await Promise.all([
        getAuditLog(active),
        getAuditLogStats(),
        getDistinctActors(),
      ]);
      setLoading(false);

      if (!logsRes.success) {
        setError(logsRes.error);
        return;
      }
      if (!statsRes.success) {
        setError(statsRes.error);
        return;
      }

      setEntries(logsRes.data.entries);
      setTotal(logsRes.data.total);
      setTotalPages(logsRes.data.totalPages);
      setStats(statsRes.data);
      if (actorsRes.success) setActors(actorsRes.data);
      setHasLoaded(true);
    },
    [filters]
  );

  const handleApplyFilters = () => {
    const updated = { ...filters, page: 1 };
    setFilters(updated);
    fetchData(updated);
  };

  const handlePageChange = (newPage: number) => {
    const updated = { ...filters, page: newPage };
    setFilters(updated);
    fetchData(updated);
  };

  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Moderation Audit Log</h1>
        <p className="mt-1 text-sm text-slate-400">
          Full history of all admin and moderator actions. Visible to administrators only.
        </p>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-300">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-200">
            ✕
          </button>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-center">
            <div className="text-2xl font-bold text-slate-50">{stats.totalActions}</div>
            <div className="mt-1 text-xs text-slate-400">Total Actions</div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-center">
            <div className="text-2xl font-bold text-sky-400">{stats.actionsLast24h}</div>
            <div className="mt-1 text-xs text-slate-400">Last 24h</div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-center">
            <div className="text-2xl font-bold text-sky-400">{stats.actionsLast7d}</div>
            <div className="mt-1 text-xs text-slate-400">Last 7 days</div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-left">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Top Actions
            </div>
            <ul className="space-y-0.5">
              {stats.topActions.map(({ action, count }) => (
                <li key={action} className="flex justify-between text-[11px] text-slate-300">
                  <span className="truncate">{action.replace(/_/g, ' ')}</span>
                  <span className="ml-2 font-semibold text-slate-200">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="text"
            placeholder="Search action, target ID, reason…"
            value={filters.search ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:border-accent-400 focus:outline-none"
          />
          <select
            value={filters.actorId ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, actorId: e.target.value }))}
            className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:border-accent-400 focus:outline-none"
          >
            <option value="">All Actors</option>
            {actors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.email}
              </option>
            ))}
          </select>
          <select
            value={filters.targetType ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, targetType: e.target.value }))}
            className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:border-accent-400 focus:outline-none"
          >
            <option value="">All Target Types</option>
            {Object.entries(TARGET_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Filter by action name…"
            value={filters.action ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
            className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:border-accent-400 focus:outline-none"
          />
          <button
            onClick={handleApplyFilters}
            disabled={loading}
            className="rounded bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Apply Filters'}
          </button>
        </div>
      </div>

      {/* Table */}
      {!hasLoaded ? (
        <div className="py-12 text-center text-slate-500">
          Apply filters to load the audit log.
        </div>
      ) : entries.length === 0 ? (
        <div className="py-12 text-center text-slate-500">No audit log entries match the current filters.</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900">
                <tr>
                  {['Timestamp', 'Actor', 'Action', 'Target', 'Reason', 'Details'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950">
                {entries.map((entry) => (
                  <>
                    <tr
                      key={entry.id}
                      className="cursor-pointer hover:bg-slate-900/50"
                      onClick={() => toggleExpand(entry.id)}
                    >
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {formatDateTime(entry.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-slate-200">{entry.actorEmail}</div>
                        <div
                          className={`mt-0.5 text-[10px] uppercase ${
                            entry.actorRole === 'ADMIN'
                              ? 'text-red-400'
                              : entry.actorRole === 'MODERATOR'
                                ? 'text-purple-400'
                                : 'text-slate-500'
                          }`}
                        >
                          {entry.actorRole}
                        </div>
                      </td>
                      <td className="px-4 py-3">{actionBadge(entry.action)}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-slate-400">
                          {TARGET_TYPE_LABELS[entry.targetType] ?? entry.targetType}
                        </div>
                        <div className="font-mono text-[10px] text-slate-600">
                          {entry.targetId.slice(0, 12)}…
                        </div>
                      </td>
                      <td className="max-w-[200px] px-4 py-3 text-xs text-slate-400">
                        {entry.reason ? (
                          <span className="line-clamp-2">{entry.reason}</span>
                        ) : (
                          <span className="italic text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {entry.metadata ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(entry.id);
                            }}
                            className="text-sky-400 hover:text-sky-300"
                          >
                            {expandedId === entry.id ? '▲ Hide' : '▼ Show'}
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                    {expandedId === entry.id && entry.metadata && (
                      <tr key={`${entry.id}-detail`} className="bg-slate-900/70">
                        <td colSpan={6} className="px-6 py-3">
                          <div className="text-xs text-slate-400 font-semibold mb-1">Metadata</div>
                          <pre className="text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(entry.metadata, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>
              {total} entr{total !== 1 ? 'ies' : 'y'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange((filters.page ?? 1) - 1)}
                disabled={(filters.page ?? 1) <= 1}
                className="rounded border border-slate-700 px-3 py-1 hover:border-slate-500 disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="px-2 py-1">
                {filters.page ?? 1} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange((filters.page ?? 1) + 1)}
                disabled={(filters.page ?? 1) >= totalPages}
                className="rounded border border-slate-700 px-3 py-1 hover:border-slate-500 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import {
  getFlaggedUsers,
  type FlaggedUser,
} from '@/app/actions/admin/reports';

const RISK_STYLES: Record<string, string> = {
  GREEN: 'bg-green-900/30 text-green-300',
  AMBER: 'bg-yellow-900/30 text-yellow-300',
  RED: 'bg-red-900/30 text-red-300',
};

const STATUS_STYLES: Record<string, string> = {
  APPROVED: 'bg-green-900/30 text-green-300',
  PENDING_REVIEW: 'bg-amber-900/30 text-amber-300',
  SUSPENDED: 'bg-red-900/30 text-red-300',
};

export function FlaggedUsersClient() {
  const [users, setUsers] = useState<FlaggedUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [riskFilter, setRiskFilter] = useState<'GREEN' | 'AMBER' | 'RED' | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'riskLabeledAt' | 'openReports'>('openReports');
  const [total, setTotal] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getFlaggedUsers({
        riskLabel: riskFilter === 'ALL' ? undefined : riskFilter,
        sortBy,
        page,
        limit: 20,
      });

      if (result.success && result.data) {
        setUsers(result.data.users);
        setTotalPages(result.data.totalPages);
        setTotal(result.data.total);
      }
    } catch (err) {
      console.error('Failed to load flagged users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, riskFilter, sortBy]);

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
          Flagged Users
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Users with elevated risk labels or open reports
        </p>
        {total > 0 && (
          <p className="mt-1 text-xs text-amber-400">{total} users flagged or reported</p>
        )}
      </header>

      {/* Filters */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div>
            <label className="block text-sm font-medium text-slate-300">Risk Level</label>
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value as typeof riskFilter);
                setPage(1);
              }}
              className="mt-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:border-accent-500 focus:outline-none"
            >
              <option value="ALL">All (non-green + reported)</option>
              <option value="GREEN">Green</option>
              <option value="AMBER">Amber</option>
              <option value="RED">Red</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as typeof sortBy);
                setPage(1);
              }}
              className="mt-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:border-accent-500 focus:outline-none"
            >
              <option value="openReports">Open Reports ↓</option>
              <option value="riskLabeledAt">Risk Labeled Date</option>
            </select>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Apply Filters'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50">
              <th className="px-4 py-3 text-left font-semibold text-slate-250">User</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-250">Profile Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-250">Risk</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-250">Risk Notes</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-250">Open Reports</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-250">Total Reports</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No flagged users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.userId} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <div className="font-medium text-slate-50">{user.alias}</div>
                      <div className="text-xs text-slate-400">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${STATUS_STYLES[user.profileStatus]}`}>
                      {user.profileStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${RISK_STYLES[user.riskLabel]}`}>
                      {user.riskLabel}
                    </span>
                    {user.riskLabeledAt && (
                      <div className="mt-1 text-[10px] text-slate-500">
                        {new Date(user.riskLabeledAt).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="line-clamp-2 text-xs text-slate-400">
                      {user.riskNotes || <span className="text-slate-600">—</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-lg font-bold ${
                        user.openReports > 2
                          ? 'text-red-400'
                          : user.openReports > 0
                            ? 'text-amber-400'
                            : 'text-slate-500'
                      }`}
                    >
                      {user.openReports}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {user.totalReports}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
          >
            ← Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { getSubscriptions, getSubscriptionStats } from '@/app/actions/admin/subscriptions';

interface SubscriptionData {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAlias: string;
  planName: string | null;
  planDescription: string | null;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  daysRemaining: number;
  createdAt: string;
  updatedAt: string;
}

export function SubscriptionsClient() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [stats, setStats] = useState({
    totalActive: 0,
    totalExpired: 0,
    totalCancelled: 0,
    totalSubscriptions: 0,
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'startDate' | 'endDate' | 'createdAt'>('startDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [subResult, statsResult] = await Promise.all([
        getSubscriptions({
          status: status === 'ALL' ? undefined : status,
          search: search || undefined,
          sortBy,
          sortOrder,
          page,
          limit: 20,
        }),
        getSubscriptionStats(),
      ]);

      if (subResult.success && subResult.data) {
        setSubscriptions(subResult.data.subscriptions);
        setTotalPages(subResult.data.totalPages);
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setLoading(false);
    }
  }, [page, status, search, sortBy, sortOrder]);

  const handleSort = (newSortBy: 'startDate' | 'endDate' | 'createdAt') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
          Subscriptions
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          View and manage user subscription status
        </p>
      </header>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Active</p>
          <p className="mt-1 text-2xl font-bold text-green-400">{stats.totalActive}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Expired</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">{stats.totalExpired}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Cancelled</p>
          <p className="mt-1 text-2xl font-bold text-red-400">{stats.totalCancelled}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Total</p>
          <p className="mt-1 text-2xl font-bold text-slate-300">{stats.totalSubscriptions}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300">Search</label>
            <input
              type="text"
              placeholder="Search by email, name, or alias..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:border-accent-500 focus:outline-none"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'ALL');
              setPage(1);
            }}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:border-accent-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

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
              <th className="px-4 py-3 text-left font-semibold text-slate-250">Plan</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-250">Status</th>
              <th
                className="px-4 py-3 text-left font-semibold text-slate-250 cursor-pointer hover:text-accent-400"
                onClick={() => handleSort('startDate')}
              >
                Start Date {sortBy === 'startDate' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-left font-semibold text-slate-250 cursor-pointer hover:text-accent-400"
                onClick={() => handleSort('endDate')}
              >
                End Date {sortBy === 'endDate' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-250">Days Left</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No subscriptions found
                </td>
              </tr>
            ) : (
              subscriptions.map((sub) => (
                <tr key={sub.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="font-medium text-slate-50">{sub.userAlias}</div>
                      <div className="text-xs text-slate-400">{sub.userEmail}</div>
                      {sub.userName !== 'N/A' && (
                        <div className="text-xs text-slate-500">{sub.userName}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="font-medium text-slate-50">{sub.planName || 'N/A'}</div>
                      {sub.planDescription && (
                        <div className="text-xs text-slate-400">{sub.planDescription}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                        sub.status === 'ACTIVE'
                          ? 'bg-green-900/30 text-green-300'
                          : sub.status === 'EXPIRED'
                            ? 'bg-amber-900/30 text-amber-300'
                            : 'bg-red-900/30 text-red-300'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {new Date(sub.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {new Date(sub.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-semibold ${
                        sub.daysRemaining > 30
                          ? 'text-green-300'
                          : sub.daysRemaining > 7
                            ? 'text-amber-300'
                            : 'text-red-300'
                      }`}
                    >
                      {sub.daysRemaining} days
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Page {page} of {totalPages}
        </p>
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

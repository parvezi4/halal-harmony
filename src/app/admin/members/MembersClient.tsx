'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  getMembers,
  getMemberStats,
  suspendMember,
  reactivateMember,
  type MemberFilters,
  type MemberRow,
  type MemberStats,
} from '@/app/actions/admin/members';

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-red-900/50 text-red-300 border border-red-700',
  MODERATOR: 'bg-purple-900/50 text-purple-300 border border-purple-700',
  MEMBER: 'bg-slate-800 text-slate-300 border border-slate-700',
};

const STATUS_STYLES: Record<string, string> = {
  PENDING_REVIEW: 'bg-amber-900/50 text-amber-300 border border-amber-700',
  APPROVED: 'bg-green-900/50 text-green-300 border border-green-700',
  SUSPENDED: 'bg-red-900/50 text-red-300 border border-red-700',
};

const RISK_STYLES: Record<string, string> = {
  GREEN: 'bg-green-900/50 text-green-300',
  AMBER: 'bg-amber-900/50 text-amber-300',
  RED: 'bg-red-900/50 text-red-300',
};

type ModalAction = 'suspend' | 'reactivate';

const INITIAL_FILTERS: MemberFilters = {
  search: '',
  role: '',
  profileStatus: '',
  subscriptionStatus: '',
  page: 1,
  pageSize: 10,
  sortBy: 'createdAt',
  sortDir: 'desc',
};

export default function MembersClient() {
  const [filters, setFilters] = useState<MemberFilters>(INITIAL_FILTERS);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<ModalAction>('suspend');
  const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchData = useCallback(async (active: MemberFilters) => {
    setLoading(true);
    setError(null);
    const [membersRes, statsRes] = await Promise.all([
      getMembers(active),
      getMemberStats(),
    ]);
    setLoading(false);

    if (!membersRes.success) {
      setError(membersRes.error);
      return;
    }
    if (!statsRes.success) {
      setError(statsRes.error);
      return;
    }

    setMembers(membersRes.data.members);
    setTotal(membersRes.data.total);
    setTotalPages(membersRes.data.totalPages);
    setStats(statsRes.data);
    setHasLoaded(true);
  }, []);

  const handleApplyFilters = () => {
    const updated = { ...filters, page: 1 };
    setFilters(updated);
    void fetchData(updated);
  };

  const handlePageChange = (newPage: number) => {
    const updated = { ...filters, page: newPage };
    setFilters(updated);
    void fetchData(updated);
  };

  useEffect(() => {
    void fetchData(INITIAL_FILTERS);
  }, [fetchData]);

  const openModal = (member: MemberRow, action: ModalAction) => {
    setSelectedMember(member);
    setModalAction(action);
    setActionReason('');
    setActionError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedMember(null);
    setActionError(null);
  };

  const handleModalSubmit = async () => {
    if (!selectedMember) return;
    if (modalAction === 'suspend' && !actionReason.trim()) {
      setActionError('A reason is required to suspend a member');
      return;
    }

    setActionLoading(true);
    setActionError(null);

    const result =
      modalAction === 'suspend'
        ? await suspendMember(selectedMember.id, actionReason)
        : await reactivateMember(selectedMember.id, actionReason || undefined);

    setActionLoading(false);

    if (!result.success) {
      setActionError(result.error ?? 'Action failed');
      return;
    }

    closeModal();
    void fetchData(filters);
  };

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const displayName = (member: MemberRow) =>
    member.profile?.alias ?? member.profile?.fullName ?? member.email.split('@')[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Member Management</h1>
        <p className="mt-1 text-sm text-slate-400">
          View and manage all registered members, their profile status, and subscriptions.
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {[
            { label: 'Total Users', value: stats.total },
            { label: 'Members', value: stats.members },
            { label: 'Moderators', value: stats.moderators },
            { label: 'Admins', value: stats.admins },
            { label: 'Pending Review', value: stats.pendingVerification, warn: true },
            { label: 'Suspended', value: stats.suspended, danger: stats.suspended > 0 },
            { label: 'Active Subs', value: stats.activeSubscriptions, good: true },
          ].map(({ label, value, warn, danger, good }) => (
            <div
              key={label}
              className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-center"
            >
              <div
                className={`text-2xl font-bold ${
                  danger ? 'text-red-400' : warn ? 'text-amber-400' : good ? 'text-green-400' : 'text-slate-50'
                }`}
              >
                {value}
              </div>
              <div className="mt-1 text-xs text-slate-400">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="text"
            placeholder="Search email or alias…"
            value={filters.search ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:border-accent-400 focus:outline-none"
          />
          <select
            value={filters.role ?? ''}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                role: e.target.value as MemberFilters['role'],
              }))
            }
            className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:border-accent-400 focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="MEMBER">Member</option>
            <option value="MODERATOR">Moderator</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            value={filters.profileStatus ?? ''}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                profileStatus: e.target.value as MemberFilters['profileStatus'],
              }))
            }
            className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:border-accent-400 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <select
            value={filters.subscriptionStatus ?? ''}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                subscriptionStatus: e.target.value as MemberFilters['subscriptionStatus'],
              }))
            }
            className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:border-accent-400 focus:outline-none"
          >
            <option value="">All Subscriptions</option>
            <option value="active">Active</option>
            <option value="expired">Expired / Cancelled</option>
            <option value="none">No Subscription</option>
          </select>
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
        <div className="py-12 text-center text-slate-500">Loading members...</div>
      ) : members.length === 0 ? (
        <div className="py-12 text-center text-slate-500">No members match the current filters.</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900">
                <tr>
                  {['Member', 'Role', 'Profile Status', 'Risk', 'Subscription', 'Reports', 'Joined', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-900/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-100">{displayName(member)}</div>
                      <div className="text-xs text-slate-500">{member.email}</div>
                      {!member.profile && (
                        <span className="text-xs text-slate-600 italic">no profile</span>
                      )}
                      {member.profile && !member.profile.onboardingCompletedAt && (
                        <span className="text-xs text-slate-500 italic">onboarding incomplete</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${ROLE_STYLES[member.role]}`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {member.profile ? (
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[member.profile.status]}`}
                        >
                          {member.profile.status.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {member.profile ? (
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${RISK_STYLES[member.profile.riskLabel]}`}
                        >
                          {member.profile.riskLabel}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {member.activeSubscription ? (
                        <div>
                          <span className="text-xs text-green-400">Active</span>
                          <div className="text-[11px] text-slate-500">
                            until {formatDate(member.activeSubscription.endDate)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {member.openReportCount > 0 ? (
                        <span className="font-semibold text-red-400">
                          {member.openReportCount}
                        </span>
                      ) : (
                        <span className="text-slate-600">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {formatDate(member.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {member.profile && (
                        <div className="flex gap-2">
                          {member.profile.status !== 'SUSPENDED' ? (
                            <button
                              onClick={() => openModal(member, 'suspend')}
                              className="rounded bg-red-900/40 px-2 py-1 text-xs text-red-300 hover:bg-red-800/60"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => openModal(member, 'reactivate')}
                              className="rounded bg-green-900/40 px-2 py-1 text-xs text-green-300 hover:bg-green-800/60"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>
              {total} member{total !== 1 ? 's' : ''} found
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

      {/* Action Modal */}
      {modalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-50">
              {modalAction === 'suspend' ? 'Suspend Member' : 'Reactivate Member'}
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              {modalAction === 'suspend' ? (
                <>
                  Suspend{' '}
                  <span className="font-medium text-slate-200">{displayName(selectedMember)}</span>
                  ? This will set their profile status to SUSPENDED.
                </>
              ) : (
                <>
                  Reactivate{' '}
                  <span className="font-medium text-slate-200">{displayName(selectedMember)}</span>
                  ? This will restore their profile to APPROVED status.
                </>
              )}
            </p>

            {actionError && (
              <div className="mt-3 rounded border border-red-700 bg-red-900/30 px-3 py-2 text-sm text-red-300">
                {actionError}
              </div>
            )}

            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-400">
                {modalAction === 'suspend' ? 'Reason (required)' : 'Reason (optional)'}
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:border-accent-400 focus:outline-none"
                placeholder={
                  modalAction === 'suspend'
                    ? 'Explain the reason for suspension…'
                    : 'Reason for reactivation (optional)…'
                }
              />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={actionLoading}
                className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSubmit}
                disabled={actionLoading}
                className={`rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  modalAction === 'suspend'
                    ? 'bg-red-700 hover:bg-red-600'
                    : 'bg-green-700 hover:bg-green-600'
                }`}
              >
                {actionLoading
                  ? 'Processing…'
                  : modalAction === 'suspend'
                    ? 'Confirm Suspend'
                    : 'Confirm Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

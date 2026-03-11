'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  getFlaggedUsers,
  type FlaggedUser,
} from '@/app/actions/admin/reports';
import {
  suspendProfile,
  updateProfileRiskLabel,
} from '@/app/actions/admin/profile-verification';
import { resolveAllAndSuspend } from '@/app/actions/admin/flagged';

// Row background tint by risk level
const ROW_RISK_BG: Record<string, string> = {
  GREEN: 'hover:bg-slate-800/30',
  AMBER: 'bg-amber-950/20 hover:bg-amber-950/35 border-amber-900/20',
  RED: 'bg-red-950/25 hover:bg-red-950/40 border-red-900/20',
};

// Badge styles for risk labels
const RISK_BADGE: Record<string, string> = {
  GREEN: 'bg-green-900/30 text-green-300',
  AMBER: 'bg-yellow-900/30 text-yellow-300',
  RED: 'bg-red-900/30 text-red-300',
};

const STATUS_BADGE: Record<string, string> = {
  APPROVED: 'bg-green-900/30 text-green-300',
  PENDING_REVIEW: 'bg-amber-900/30 text-amber-300',
  SUSPENDED: 'bg-red-900/30 text-red-300',
};

type ModalType = 'suspend' | 'risk' | 'resolve_suspend';

interface ModalState {
  type: ModalType;
  user: FlaggedUser;
}

export function FlaggedUsersClient() {
  const [users, setUsers] = useState<FlaggedUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [riskFilter, setRiskFilter] = useState<'GREEN' | 'AMBER' | 'RED' | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'riskLabeledAt' | 'openReports'>('openReports');
  const [total, setTotal] = useState(0);

  // Action modal state
  const [modal, setModal] = useState<ModalState | null>(null);
  const [modalReason, setModalReason] = useState('');
  const [modalRisk, setModalRisk] = useState<'GREEN' | 'AMBER' | 'RED'>('AMBER');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // Auto-load on mount and whenever filters change
  useEffect(() => {
    loadData();
  }, [loadData]);

  const openModal = (type: ModalType, user: FlaggedUser) => {
    setModal({ type, user });
    setModalReason('');
    setModalRisk(user.riskLabel);
    setActionError(null);
  };

  const closeModal = () => {
    setModal(null);
    setModalReason('');
    setActionError(null);
  };

  const handleConfirm = async () => {
    if (!modal) return;
    setActionLoading(true);
    setActionError(null);

    try {
      let result: { success: boolean; message?: string; errors?: { general?: string } };

      if (modal.type === 'suspend') {
        result = await suspendProfile(modal.user.profileId, modalReason);
      } else if (modal.type === 'risk') {
        result = await updateProfileRiskLabel(modal.user.profileId, modalRisk, modalReason);
      } else {
        result = await resolveAllAndSuspend(modal.user.userId, modal.user.profileId, modalReason);
      }

      if (result.success) {
        closeModal();
        setSuccessMessage(result.message || 'Action completed');
        window.setTimeout(() => setSuccessMessage(null), 4000);
        await loadData();
      } else {
        setActionError(result.errors?.general || 'Action failed');
      }
    } catch {
      setActionError('An unexpected error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const modalTitle: Record<ModalType, string> = {
    suspend: 'Suspend User',
    risk: 'Update Risk Label',
    resolve_suspend: 'Resolve All Reports & Suspend User',
  };

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
          Flagged Users
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Users with elevated risk labels or open reports. Use inline actions to update risk, suspend, or resolve reports.
        </p>
        {total > 0 && (
          <p className="mt-1 text-xs text-amber-400">{total} users flagged or reported</p>
        )}
      </header>

      {successMessage && (
        <div className="rounded-lg border border-green-700 bg-green-900/30 px-4 py-3 text-sm text-green-300">
          ✓ {successMessage}
        </div>
      )}

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
            {loading ? 'Loading…' : 'Apply Filters'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50">
              <th className="px-4 py-3 text-left font-semibold text-slate-300">User</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-300">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-300">Risk</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-300">Risk Notes</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-300">Reports</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No flagged users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.userId}
                  className={`border-b border-slate-800/50 transition-colors ${ROW_RISK_BG[user.riskLabel]}`}
                >
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <div className="font-medium text-slate-50">{user.alias}</div>
                      <div className="text-xs text-slate-400">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${STATUS_BADGE[user.profileStatus]}`}>
                      {user.profileStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${RISK_BADGE[user.riskLabel]}`}>
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
                      {user.riskNotes ?? <span className="text-slate-600">—</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-base font-bold ${
                        user.openReports > 2
                          ? 'text-red-400'
                          : user.openReports > 0
                            ? 'text-amber-400'
                            : 'text-slate-500'
                      }`}
                    >
                      {user.openReports}
                    </span>
                    <span className="text-xs text-slate-600"> / {user.totalReports}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {/* Update Risk Label — always available */}
                      <button
                        onClick={() => openModal('risk', user)}
                        className="rounded bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-600 transition"
                      >
                        Risk Label
                      </button>

                      {/* Suspend — only when not already suspended */}
                      {user.profileStatus !== 'SUSPENDED' && (
                        <button
                          onClick={() => openModal('suspend', user)}
                          className="rounded bg-amber-700/60 px-2.5 py-1 text-xs font-medium text-amber-100 hover:bg-amber-700 transition"
                        >
                          Suspend
                        </button>
                      )}

                      {/* Resolve + Suspend — only when there are open reports and not suspended */}
                      {user.openReports > 0 && user.profileStatus !== 'SUSPENDED' && (
                        <button
                          onClick={() => openModal('resolve_suspend', user)}
                          className="rounded bg-red-700/60 px-2.5 py-1 text-xs font-medium text-red-100 hover:bg-red-700 transition"
                        >
                          Resolve + Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
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
      )}

      {/* Action Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-50">{modalTitle[modal.type]}</h2>
            <p className="mt-1 text-sm text-slate-400">
              <span className="font-medium text-slate-200">{modal.user.alias}</span>{' '}
              ({modal.user.email})
            </p>

            {modal.type === 'resolve_suspend' && (
              <p className="mt-2 rounded-lg bg-red-900/30 px-3 py-2 text-xs text-red-300">
                This will resolve all {modal.user.openReports} open report(s) and suspend the user&apos;s profile.
              </p>
            )}

            {modal.type === 'risk' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-300">New Risk Level</label>
                <select
                  value={modalRisk}
                  onChange={(e) => setModalRisk(e.target.value as typeof modalRisk)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:border-accent-500 focus:outline-none"
                >
                  <option value="GREEN">GREEN — safe</option>
                  <option value="AMBER">AMBER — caution</option>
                  <option value="RED">RED — high risk</option>
                </select>
              </div>
            )}

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300">
                {modal.type === 'risk' ? 'Notes (required)' : 'Reason (required)'}
              </label>
              <textarea
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
                rows={3}
                placeholder={
                  modal.type === 'risk'
                    ? 'Describe the risk assessment…'
                    : 'Describe why this user is being suspended…'
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:border-accent-500 focus:outline-none"
              />
            </div>

            {actionError && (
              <p className="mt-2 text-sm text-red-400">{actionError}</p>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={actionLoading}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={actionLoading || !modalReason.trim()}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  modal.type === 'resolve_suspend'
                    ? 'bg-red-600 hover:bg-red-700'
                    : modal.type === 'suspend'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-accent-600 hover:bg-accent-700'
                }`}
              >
                {actionLoading ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



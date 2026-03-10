'use client';

import { useState, useCallback } from 'react';
import {
  getPendingProfiles,
  getProfileVerificationStats,
  approveProfile,
  suspendProfile,
  updateProfileRiskLabel,
  type ProfileForVerification,
} from '@/app/actions/admin/profile-verification';

export function ProfilesClient() {
  const [profiles, setProfiles] = useState<ProfileForVerification[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    suspended: 0,
    flaggedAMBER: 0,
    flaggedRED: 0,
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'PENDING_REVIEW' | 'APPROVED' | 'SUSPENDED'>(
    'PENDING_REVIEW'
  );
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState<'GREEN' | 'AMBER' | 'RED' | 'ALL'>('ALL');
  const [selectedProfile, setSelectedProfile] = useState<ProfileForVerification | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'suspend' | 'risk'>('approve');
  const [modalReason, setModalReason] = useState('');
  const [riskLabel, setRiskLabel] = useState<'GREEN' | 'AMBER' | 'RED'>('GREEN');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesResult, statsResult] = await Promise.all([
        getPendingProfiles({
          status,
          riskLevel: riskLevel === 'ALL' ? undefined : riskLevel,
          search: search || undefined,
          page,
          limit: 20,
        }),
        getProfileVerificationStats(),
      ]);

      if (profilesResult.success && profilesResult.data) {
        setProfiles(profilesResult.data.profiles);
        setTotalPages(profilesResult.data.totalPages);
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
    } finally {
      setLoading(false);
    }
  }, [page, status, search, riskLevel]);

  const handleOpenModal = (profile: ProfileForVerification, action: 'approve' | 'suspend' | 'risk') => {
    setSelectedProfile(profile);
    setModalAction(action);
    setModalReason('');
    if (action === 'risk') {
      setRiskLabel(profile.riskLabel);
    }
    setShowModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedProfile) return;

    setProcessing(true);
    try {
      let result;

      if (modalAction === 'approve') {
        result = await approveProfile(selectedProfile.id, modalReason || undefined);
      } else if (modalAction === 'suspend') {
        result = await suspendProfile(selectedProfile.id, modalReason);
      } else {
        result = await updateProfileRiskLabel(selectedProfile.id, riskLabel, modalReason);
      }

      if (result.success) {
        setShowModal(false);
        setSelectedProfile(null);
        setError(null);
        await loadData();
      } else {
        setError(result.errors?.general || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error performing action:', error);
      setError('Failed to perform action');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
          Profile Verification
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Review and approve or suspend user profiles
        </p>
      </header>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Pending Review</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">{stats.pending}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Approved</p>
          <p className="mt-1 text-2xl font-bold text-green-400">{stats.approved}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Suspended</p>
          <p className="mt-1 text-2xl font-bold text-red-400">{stats.suspended}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Risk: AMBER</p>
          <p className="mt-1 text-2xl font-bold text-yellow-400">{stats.flaggedAMBER}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Risk: RED</p>
          <p className="mt-1 text-2xl font-bold text-red-500">{stats.flaggedRED}</p>
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
              setStatus(e.target.value as 'PENDING_REVIEW' | 'APPROVED' | 'SUSPENDED');
              setPage(1);
            }}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:border-accent-500 focus:outline-none"
          >
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          <select
            value={riskLevel}
            onChange={(e) => {
              setRiskLevel(e.target.value as 'GREEN' | 'AMBER' | 'RED' | 'ALL');
              setPage(1);
            }}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:border-accent-500 focus:outline-none"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="GREEN">Green</option>
            <option value="AMBER">Amber</option>
            <option value="RED">Red</option>
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

      {/* Profiles Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50">
              <th className="px-4 py-3 text-left font-semibold text-slate-250">User</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-250">Info</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-250">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-250">Risk</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-250">Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No profiles found
                </td>
              </tr>
            ) : (
              profiles.map((profile) => (
                <tr key={profile.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="font-medium text-slate-50">{profile.userAlias}</div>
                      <div className="text-xs text-slate-400">{profile.userEmail}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1 text-xs text-slate-400">
                      <div>{profile.gender}</div>
                      <div>
                        {profile.city || 'N/A'}
                        {profile.country && `, ${profile.country}`}
                      </div>
                      <div>{profile.practicingLevel || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                        profile.status === 'APPROVED'
                          ? 'bg-green-900/30 text-green-300'
                          : profile.status === 'SUSPENDED'
                            ? 'bg-red-900/30 text-red-300'
                            : 'bg-amber-900/30 text-amber-300'
                      }`}
                    >
                      {profile.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <span
                        className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                          profile.riskLabel === 'RED'
                            ? 'bg-red-900/30 text-red-300'
                            : profile.riskLabel === 'AMBER'
                              ? 'bg-yellow-900/30 text-yellow-300'
                              : 'bg-green-900/30 text-green-300'
                        }`}
                      >
                        {profile.riskLabel}
                      </span>
                      {profile.riskNotes && (
                        <div className="text-xs text-slate-400 line-clamp-2">
                          {profile.riskNotes}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {profile.status === 'PENDING_REVIEW' && (
                        <>
                          <button
                            onClick={() => handleOpenModal(profile, 'approve')}
                            className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenModal(profile, 'suspend')}
                            className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                          >
                            Suspend
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleOpenModal(profile, 'risk')}
                        className="rounded bg-slate-600 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700"
                      >
                        Risk Label
                      </button>
                    </div>
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

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/30 p-4">
          <p className="text-sm text-red-200">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-red-300 hover:text-red-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedProfile && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4 z-50">
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-slate-50 mb-4">
              {modalAction === 'approve'
                ? 'Approve Profile'
                : modalAction === 'suspend'
                  ? 'Suspend Profile'
                  : 'Update Risk Label'}
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400">User</p>
                <p className="text-slate-50 font-medium">{selectedProfile.userAlias}</p>
              </div>

              {modalAction === 'risk' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Risk Level
                  </label>
                  <select
                    value={riskLabel}
                    onChange={(e) => setRiskLabel(e.target.value as 'GREEN' | 'AMBER' | 'RED')}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-50 focus:border-accent-500 focus:outline-none"
                  >
                    <option value="GREEN">Green</option>
                    <option value="AMBER">Amber</option>
                    <option value="RED">Red</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {modalAction === 'approve'
                    ? 'Approval Notes (optional)'
                    : modalAction === 'suspend'
                      ? 'Suspension Reason (required)'
                      : 'Risk Notes (required)'}
                </label>
                <textarea
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  placeholder="Enter your notes here..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-50 placeholder-slate-500 focus:border-accent-500 focus:outline-none"
                  rows={4}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                disabled={processing}
                className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={
                  processing ||
                  (modalAction === 'suspend' && !modalReason.trim()) ||
                  (modalAction === 'risk' && !modalReason.trim())
                }
                className="flex-1 rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

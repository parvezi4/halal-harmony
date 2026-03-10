'use client';

import { useState, useCallback } from 'react';
import {
  getPendingPhotos,
  getPhotoVerificationStats,
  approvePhoto,
  rejectPhoto,
  blurPhoto,
  type PhotoForVerification,
} from '@/app/actions/admin/photo-verification';

export function PhotosClient() {
  const [photos, setPhotos] = useState<PhotoForVerification[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    blurred: 0,
    total: 0,
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'PENDING' | 'APPROVED'>('PENDING');
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState<'GREEN' | 'AMBER' | 'RED' | 'ALL'>('ALL');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoForVerification | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | 'blur'>('approve');
  const [modalReason, setModalReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [photosResult, statsResult] = await Promise.all([
        getPendingPhotos({
          status,
          profileRiskLevel: riskLevel === 'ALL' ? undefined : riskLevel,
          search: search || undefined,
          page,
          limit: 12,
        }),
        getPhotoVerificationStats(),
      ]);

      if (photosResult.success && photosResult.data) {
        setPhotos(photosResult.data.photos);
        setTotalPages(photosResult.data.totalPages);
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setLoading(false);
    }
  }, [page, status, search, riskLevel]);

  const handleOpenModal = (
    photo: PhotoForVerification,
    action: 'approve' | 'reject' | 'blur'
  ) => {
    setSelectedPhoto(photo);
    setModalAction(action);
    setModalReason('');
    setShowModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedPhoto) return;

    setProcessing(true);
    try {
      let result;

      if (modalAction === 'approve') {
        result = await approvePhoto(selectedPhoto.id, modalReason || undefined);
      } else if (modalAction === 'reject') {
        result = await rejectPhoto(selectedPhoto.id, modalReason);
      } else {
        result = await blurPhoto(selectedPhoto.id, modalReason || undefined);
      }

      if (result.success) {
        setShowModal(false);
        setSelectedPhoto(null);
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
          Photo Verification
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Review and approve or reject user profile photos
        </p>
      </header>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">{stats.pending}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Approved</p>
          <p className="mt-1 text-2xl font-bold text-green-400">{stats.approved}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Blurred</p>
          <p className="mt-1 text-2xl font-bold text-blue-400">{stats.blurred}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Total</p>
          <p className="mt-1 text-2xl font-bold text-slate-300">{stats.total}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300">Search</label>
            <input
              type="text"
              placeholder="Search by email or name..."
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
              setStatus(e.target.value as 'PENDING' | 'APPROVED');
              setPage(1);
            }}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:border-accent-500 focus:outline-none"
          >
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
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

      {/* Photos Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {photos.length === 0 ? (
          <div className="col-span-full rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
            <p className="text-slate-400">No photos found</p>
          </div>
        ) : (
          photos.map((photo) => (
            <div
              key={photo.id}
              className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/70 hover:border-slate-700"
            >
              {/* Photo Preview */}
              <div className="relative h-48 bg-slate-800">
                {photo.isBlurred ? (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
                    <span className="text-xs text-slate-400">BLURRED</span>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.url}
                    alt="User photo"
                    className="h-full w-full object-cover"
                  />
                )}
                {photo.isPrimary && (
                  <div className="absolute top-2 right-2 rounded bg-accent-600 px-2 py-1 text-xs font-semibold text-white">
                    Primary
                  </div>
                )}
              </div>

              {/* Photo Info */}
              <div className="space-y-3 p-3">
                <div>
                  <p className="text-xs text-slate-400">User</p>
                  <p className="text-sm font-medium text-slate-50">{photo.userAlias}</p>
                  <p className="text-xs text-slate-500">{photo.userEmail}</p>
                </div>

                <div className="flex gap-2">
                  <div>
                    <p className="text-xs text-slate-400">Status</p>
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                        photo.isApproved
                          ? 'bg-green-900/30 text-green-300'
                          : 'bg-amber-900/30 text-amber-300'
                      }`}
                    >
                      {photo.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Risk</p>
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                        photo.profileRiskLabel === 'RED'
                          ? 'bg-red-900/30 text-red-300'
                          : photo.profileRiskLabel === 'AMBER'
                            ? 'bg-yellow-900/30 text-yellow-300'
                            : 'bg-green-900/30 text-green-300'
                      }`}
                    >
                      {photo.profileRiskLabel}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  {formatFileSize(photo.fileSizeBytes)} • {photo.mimeType}
                </p>

                {/* Actions */}
                <div className="flex flex-wrap gap-1 pt-2">
                  {!photo.isApproved && (
                    <>
                      <button
                        onClick={() => handleOpenModal(photo, 'approve')}
                        className="flex-1 rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleOpenModal(photo, 'reject')}
                        className="flex-1 rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleOpenModal(photo, 'blur')}
                    className="flex-1 rounded bg-slate-600 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700"
                  >
                    {photo.isBlurred ? 'Unblur' : 'Blur'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
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

      {/* Modal */}
      {showModal && selectedPhoto && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4 z-50">
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-slate-50 mb-4">
              {modalAction === 'approve'
                ? 'Approve Photo'
                : modalAction === 'reject'
                  ? 'Reject Photo'
                  : selectedPhoto.isBlurred
                    ? 'Unblur Photo'
                    : 'Blur Photo'}
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400">File Info</p>
                <p className="text-slate-50 font-medium text-sm">
                  {selectedPhoto.mimeType} • {formatFileSize(selectedPhoto.fileSizeBytes)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {modalAction === 'approve'
                    ? 'Approval Notes (optional)'
                    : modalAction === 'reject'
                      ? 'Rejection Reason (required)'
                      : 'Blur Reason (optional)'}
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
                disabled={processing || (modalAction === 'reject' && !modalReason.trim())}
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

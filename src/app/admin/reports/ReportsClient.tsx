'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  getReports,
  getReportStats,
  updateReportStatus,
  type ReportSummary,
} from '@/app/actions/admin/reports';

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-red-900/30 text-red-300',
  REVIEWING: 'bg-amber-900/30 text-amber-300',
  RESOLVED: 'bg-green-900/30 text-green-300',
  DISMISSED: 'bg-slate-700/50 text-slate-400',
};

const RISK_STYLES: Record<string, string> = {
  GREEN: 'bg-green-900/30 text-green-300',
  AMBER: 'bg-yellow-900/30 text-yellow-300',
  RED: 'bg-red-900/30 text-red-300',
};

export function ReportsClient() {
  const DEFAULT_LIMIT = 10;
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [stats, setStats] = useState({
    open: 0,
    reviewing: 0,
    resolved: 0,
    dismissed: 0,
    total: 0,
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED' | 'ALL'
  >('OPEN');
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState<ReportSummary | null>(null);
  const [modalAction, setModalAction] = useState<'REVIEWING' | 'RESOLVED' | 'DISMISSED'>(
    'REVIEWING'
  );
  const [modalNote, setModalNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadData = useCallback(async (active: { page: number; statusFilter: typeof statusFilter; search: string }) => {
    setLoading(true);
    try {
      const [reportsResult, statsResult] = await Promise.all([
        getReports({
          status: active.statusFilter === 'ALL' ? undefined : active.statusFilter,
          search: active.search || undefined,
          page: active.page,
          limit: DEFAULT_LIMIT,
        }),
        getReportStats(),
      ]);

      if (reportsResult.success && reportsResult.data) {
        setReports(reportsResult.data.reports);
        setTotalPages(reportsResult.data.totalPages);
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setHasLoaded(true);
      setLoading(false);
    }
  }, []);

  const handleApplyFilters = () => {
    const nextPage = 1;
    setPage(nextPage);
    void loadData({ page: nextPage, statusFilter, search });
  };

  const handlePageChange = (newPage: number) => {
    const safeMax = Math.max(1, totalPages);
    const nextPage = Math.min(Math.max(1, newPage), safeMax);
    setPage(nextPage);
    void loadData({ page: nextPage, statusFilter, search });
  };

  useEffect(() => {
    void loadData({ page: 1, statusFilter: 'OPEN', search: '' });
  }, [loadData]);

  const handleOpenModal = (
    report: ReportSummary,
    action: 'REVIEWING' | 'RESOLVED' | 'DISMISSED'
  ) => {
    setSelectedReport(report);
    setModalAction(action);
    setModalNote('');
    setError(null);
  };

  const handleConfirm = async () => {
    if (!selectedReport) return;
    setProcessing(true);
    try {
      const result = await updateReportStatus(
        selectedReport.id,
        modalAction,
        modalNote || undefined
      );
      if (result.success) {
        setSelectedReport(null);
        setError(null);
        await loadData({ page, statusFilter, search });
      } else {
        setError(result.errors?.general || 'Unknown error');
      }
    } catch (err) {
      console.error('Error updating report:', err);
      setError('Failed to update report');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
          User Reports
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Review and resolve reports filed by users
        </p>
      </header>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-red-900/50 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Open</p>
          <p className="mt-1 text-2xl font-bold text-red-400">{stats.open}</p>
        </div>
        <div className="rounded-xl border border-amber-900/50 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Reviewing</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">{stats.reviewing}</p>
        </div>
        <div className="rounded-xl border border-green-900/50 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Resolved</p>
          <p className="mt-1 text-2xl font-bold text-green-400">{stats.resolved}</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Dismissed</p>
          <p className="mt-1 text-2xl font-bold text-slate-400">{stats.dismissed}</p>
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
              placeholder="Search by email, alias, or reason..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:border-accent-500 focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setPage(1);
            }}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:border-accent-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="REVIEWING">Reviewing</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>
          <button
            onClick={handleApplyFilters}
            disabled={loading}
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Apply Filters'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/30 p-4">
          <p className="text-sm text-red-200">{error}</p>
          <button onClick={() => setError(null)} className="mt-2 text-xs text-red-300 hover:text-red-200">
            Dismiss
          </button>
        </div>
      )}

      {/* Reports Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50">
              <th className="px-4 py-3 text-left font-semibold text-slate-250">Reporter</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-250">Reported User</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-250">Reason</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-250">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-250">Date</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-250">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!hasLoaded ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Loading reports...
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No reports found
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <div className="text-slate-50 font-medium">{report.reporterAlias}</div>
                      <div className="text-xs text-slate-400">{report.reporterEmail}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {report.reportedUserEmail ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-50 font-medium">
                            {report.reportedUserAlias || 'N/A'}
                          </span>
                          {report.reportedUserRisk && (
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${RISK_STYLES[report.reportedUserRisk]}`}>
                              {report.reportedUserRisk}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">{report.reportedUserEmail}</div>
                      </div>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="line-clamp-2 text-slate-300 text-xs">{report.reason}</p>
                    {report.hasThread && (
                      <span className="mt-1 inline-block rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">
                        via message thread
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${STATUS_STYLES[report.status]}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {(report.status === 'OPEN' || report.status === 'REVIEWING') && (
                      <div className="flex flex-wrap gap-1">
                        {report.status === 'OPEN' && (
                          <button
                            onClick={() => handleOpenModal(report, 'REVIEWING')}
                            className="rounded bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-700"
                          >
                            Review
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenModal(report, 'RESOLVED')}
                          className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => handleOpenModal(report, 'DISMISSED')}
                          className="rounded bg-slate-600 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
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
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1 || loading}
            className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
          >
            ← Prev
          </button>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages || loading || totalPages === 0}
            className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Action Modal */}
      {selectedReport && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4 z-50">
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-slate-50 mb-4">
              Mark Report as{' '}
              <span className={`capitalize ${modalAction === 'RESOLVED' ? 'text-green-400' : modalAction === 'REVIEWING' ? 'text-amber-400' : 'text-slate-400'}`}>
                {modalAction.toLowerCase()}
              </span>
            </h2>
            <div className="mb-4 space-y-1 rounded-lg bg-slate-800/50 p-3 text-xs">
              <p className="text-slate-400">
                Reporter: <span className="text-slate-200">{selectedReport.reporterAlias}</span>
              </p>
              {selectedReport.reportedUserAlias && (
                <p className="text-slate-400">
                  Reported: <span className="text-slate-200">{selectedReport.reportedUserAlias}</span>
                </p>
              )}
              <p className="mt-1 text-slate-300 italic">&ldquo;{selectedReport.reason}&rdquo;</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Resolution Note (optional)
              </label>
              <textarea
                value={modalNote}
                onChange={(e) => setModalNote(e.target.value)}
                placeholder="Add a note for the audit log..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:border-accent-500 focus:outline-none"
                rows={3}
              />
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setSelectedReport(null)}
                disabled={processing}
                className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={processing}
                className="flex-1 rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
              >
                {processing ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

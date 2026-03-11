import { verifyAdminOrModerator } from '@/lib/admin/access';
import { getModerationStats } from '@/app/actions/admin/moderation';
import { getPendingProfiles } from '@/app/actions/admin/profile-verification';
import { getPendingPhotos } from '@/app/actions/admin/photo-verification';
import { getReportStats } from '@/app/actions/admin/reports';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const access = await verifyAdminOrModerator();

  // Not authenticated → admin login
  if (!access.userId) {
    redirect('/admin/login');
  }

  // Authenticated but not authorized (MEMBER role) → user dashboard
  if (!access.authorized) {
    redirect('/dashboard');
  }

  const isAdmin = access.role === 'ADMIN';

  // Fetch dashboard stats in parallel; failures (e.g. capability not granted) return null count
  const [msgStats, profileRes, photoRes, reportStats] = await Promise.all([
    getModerationStats(),
    getPendingProfiles({ status: 'PENDING_REVIEW', limit: 1 }),
    getPendingPhotos({ status: 'PENDING', limit: 1 }),
    getReportStats(),
  ]);

  const pendingMessages = msgStats.success ? (msgStats.data?.pending ?? 0) : 0;
  const pendingProfiles = profileRes.success ? (profileRes.data?.total ?? 0) : 0;
  const pendingPhotos = photoRes.success ? (photoRes.data?.total ?? 0) : 0;
  const openReports = reportStats.success
    ? (reportStats.data?.open ?? 0) + (reportStats.data?.reviewing ?? 0)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-50">
          {isAdmin ? 'Admin Dashboard' : 'Moderator Dashboard'}
        </h1>
        <p className="mt-2 text-slate-400">
          {isAdmin
            ? 'Welcome to the Halal Harmony administration panel. Full access to all moderation and management tools.'
            : 'Welcome to the Halal Harmony moderation panel. Manage content and user reports based on your permissions.'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/moderation"
          className="rounded-lg border border-slate-800 bg-slate-900 p-4 hover:border-slate-700 hover:bg-slate-850 transition"
        >
          <div className="flex items-start justify-between">
            <div className="text-2xl font-bold text-blue-400">💬</div>
            {pendingMessages > 0 && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-400">
                {pendingMessages}
              </span>
            )}
          </div>
          <h3 className="mt-2 font-semibold text-slate-50">Message Queue</h3>
          <p className="mt-1 text-sm text-slate-400">
            {pendingMessages > 0 ? `${pendingMessages} pending review` : 'Review flagged messages'}
          </p>
        </Link>

        <Link
          href="/admin/moderation/profiles"
          className="rounded-lg border border-slate-800 bg-slate-900 p-4 hover:border-slate-700 hover:bg-slate-850 transition"
        >
          <div className="flex items-start justify-between">
            <div className="text-2xl font-bold text-emerald-400">✓</div>
            {pendingProfiles > 0 && (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                {pendingProfiles}
              </span>
            )}
          </div>
          <h3 className="mt-2 font-semibold text-slate-50">Profile Verification</h3>
          <p className="mt-1 text-sm text-slate-400">
            {pendingProfiles > 0 ? `${pendingProfiles} awaiting approval` : 'Approve or suspend profiles'}
          </p>
        </Link>

        <Link
          href="/admin/moderation/photos"
          className="rounded-lg border border-slate-800 bg-slate-900 p-4 hover:border-slate-700 hover:bg-slate-850 transition"
        >
          <div className="flex items-start justify-between">
            <div className="text-2xl font-bold text-purple-400">📸</div>
            {pendingPhotos > 0 && (
              <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-semibold text-purple-400">
                {pendingPhotos}
              </span>
            )}
          </div>
          <h3 className="mt-2 font-semibold text-slate-50">Photo Verification</h3>
          <p className="mt-1 text-sm text-slate-400">
            {pendingPhotos > 0 ? `${pendingPhotos} awaiting review` : 'Review and approve photos'}
          </p>
        </Link>

        <Link
          href="/admin/reports"
          className="rounded-lg border border-slate-800 bg-slate-900 p-4 hover:border-slate-700 hover:bg-slate-850 transition"
        >
          <div className="flex items-start justify-between">
            <div className="text-2xl font-bold text-red-400">🚩</div>
            {openReports > 0 && (
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-400">
                {openReports}
              </span>
            )}
          </div>
          <h3 className="mt-2 font-semibold text-slate-50">User Reports</h3>
          <p className="mt-1 text-sm text-slate-400">
            {openReports > 0 ? `${openReports} open / in review` : 'Handle user complaints'}
          </p>
        </Link>
      </div>

      {/* Additional Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/subscriptions"
          className="rounded-lg border border-slate-800 bg-slate-900 p-4 hover:border-slate-700 hover:bg-slate-850 transition"
        >
          <div className="text-2xl font-bold text-yellow-400">💳</div>
          <h3 className="mt-2 font-semibold text-slate-50">Subscriptions</h3>
          <p className="mt-1 text-sm text-slate-400">View and manage subscriptions</p>
        </Link>

        <Link
          href="/admin/members"
          className="rounded-lg border border-slate-800 bg-slate-900 p-4 hover:border-slate-700 hover:bg-slate-850 transition"
        >
          <div className="text-2xl font-bold text-cyan-400">👥</div>
          <h3 className="mt-2 font-semibold text-slate-50">Members</h3>
          <p className="mt-1 text-sm text-slate-400">Manage users and roles</p>
        </Link>

        <Link
          href="/admin/flagged"
          className="rounded-lg border border-slate-800 bg-slate-900 p-4 hover:border-slate-700 hover:bg-slate-850 transition"
        >
          <div className="text-2xl font-bold text-orange-400">⚠️</div>
          <h3 className="mt-2 font-semibold text-slate-50">Flagged Users</h3>
          <p className="mt-1 text-sm text-slate-400">High-risk user tracking</p>
        </Link>

        {isAdmin && (
          <Link
            href="/admin/audit-log"
            className="rounded-lg border border-slate-800 bg-slate-900 p-4 hover:border-slate-700 hover:bg-slate-850 transition"
          >
            <div className="text-2xl font-bold text-slate-400">📋</div>
            <h3 className="mt-2 font-semibold text-slate-50">Audit Log</h3>
            <p className="mt-1 text-sm text-slate-400">Activity history (admin only)</p>
          </Link>
        )}

        {isAdmin && (
          <Link
            href="/admin/moderation/settings"
            className="rounded-lg border border-slate-800 bg-slate-900 p-4 hover:border-slate-700 hover:bg-slate-850 transition"
          >
            <div className="text-2xl font-bold text-slate-300">⚙️</div>
            <h3 className="mt-2 font-semibold text-slate-50">Settings</h3>
            <p className="mt-1 text-sm text-slate-400">Configure admin defaults</p>
          </Link>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">
              Logged in as <span className="font-medium text-slate-200">{access.userId}</span>
            </p>
            <p className="text-xs text-slate-600">
              Role: <span className="font-semibold">{access.role}</span>
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-slate-400 hover:text-slate-200 transition"
          >
            ← Back to User Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

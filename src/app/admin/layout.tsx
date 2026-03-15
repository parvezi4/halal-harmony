import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getAdminFeatureAccess } from '@/lib/admin/access';
import AdminLogoutButton from './AdminLogoutButton';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const access = await getAdminFeatureAccess();

  if (!access.userId) {
    redirect('/admin/login');
  }

  if (!access.role || access.role === 'MEMBER') {
    redirect('/dashboard');
  }

  const isElevated = access.role === 'SUPERADMIN' || access.role === 'ADMIN';
  const features = access.features;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              HH
            </div>
            <span className="text-sm font-semibold tracking-tight">Halal Harmony Admin</span>
          </Link>
          <nav className="flex items-center gap-4 text-xs sm:text-sm">
            {features.canModerateMessages && (
              <Link href="/admin/moderation" className="text-slate-200 hover:text-accent-200">
                Message Queue
              </Link>
            )}
            {features.canVerifyProfiles && (
              <Link href="/admin/moderation/profiles" className="text-slate-200 hover:text-accent-200">
                Profile Queue
              </Link>
            )}
            {features.canVerifyPhotos && (
              <Link href="/admin/moderation/photos" className="text-slate-200 hover:text-accent-200">
                Photo Queue
              </Link>
            )}
            {features.canInspectSubscriptions && (
              <>
                <Link href="/admin/subscriptions" className="text-slate-200 hover:text-accent-200">
                  Subscriptions
                </Link>
                <Link href="/admin/payments" className="text-slate-200 hover:text-accent-200">
                  Payments
                </Link>
              </>
            )}
            {features.canManageReports && (
              <Link href="/admin/reports" className="text-slate-200 hover:text-accent-200">
                Reports
              </Link>
            )}
            {features.canManageReports && (
              <Link href="/admin/flagged" className="text-slate-200 hover:text-accent-200">
                Flagged Users
              </Link>
            )}
            {features.canManageMembers && (
              <Link href="/admin/members" className="text-slate-200 hover:text-accent-200">
                Members
              </Link>
            )}
            {features.canViewAuditLog && (
              <>
                <Link
                  href="/admin/audit-log"
                  className="text-slate-200 hover:text-accent-200"
                >
                  Audit Log
                </Link>
                <Link
                  href="/admin/moderation/settings"
                  className="text-slate-200 hover:text-accent-200"
                >
                  Settings
                </Link>
              </>
            )}
            {!isElevated && (
              <span className="rounded border border-slate-700 px-2 py-1 text-[11px] uppercase tracking-wide text-slate-400">
                Moderator View
              </span>
            )}
            <div className="ml-2 border-l border-slate-700 pl-4">
              <AdminLogoutButton />
            </div>
          </nav>
        </div>
      </header>
      <main className="flex-1 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</div>
      </main>
    </div>
  );
}

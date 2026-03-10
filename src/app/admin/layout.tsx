import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = (await getServerSession(authOptions)) as
    | (Session & { user: { id: string; role: string } })
    | null;

  if (!session?.user) {
    redirect('/auth/login');
  }

  // Verify admin role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/admin/moderation" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              HH
            </div>
            <span className="text-sm font-semibold tracking-tight">Halal Harmony Admin</span>
          </Link>
          <nav className="flex items-center gap-4 text-xs sm:text-sm">
            <Link href="/admin/moderation" className="text-slate-200 hover:text-accent-200">
              Moderation Queue
            </Link>
            <Link
              href="/admin/moderation/settings"
              className="text-slate-200 hover:text-accent-200"
            >
              Settings
            </Link>
            <div className="ml-2 border-l border-slate-700 pl-4">
              <Link href="/dashboard" className="text-slate-400 hover:text-slate-200">
                ← Back to Site
              </Link>
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

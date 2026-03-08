'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDashboardData, type DashboardResponse } from '@/app/actions/dashboard';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      const result = await getDashboardData();
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.errors?.general || 'Failed to load dashboard');
      }
      setLoading(false);
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 w-full animate-pulse rounded-lg bg-slate-800" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-900 bg-red-950 p-4 text-red-200">
        <p className="font-semibold">Error loading dashboard</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const subscriptionBadgeConfig = {
    free: { label: 'Free member', color: 'bg-slate-700' },
    active: { label: 'Premium member', color: 'bg-accent-600' },
    expired: { label: 'Membership expired', color: 'bg-amber-700' },
    cancelled: { label: 'Membership cancelled', color: 'bg-slate-600' },
  };

  const subConfig = subscriptionBadgeConfig[data.subscriptionStatus];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-300">
            Member dashboard
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
            Assalamu alaikum, <span className="text-accent-200">{data.userName}</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Member since {data.memberSinceDate}. May Allah put barakah in your search.
          </p>
        </div>
        <div className={`inline-flex items-center gap-2 rounded-full border border-slate-700 ${subConfig.color} px-4 py-1.5 text-xs text-slate-50`}>
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="font-medium">{subConfig.label}</span>
          {data.subscriptionStatus === 'free' && (
            <Link href="/pricing" className="rounded-full bg-accent-500 px-3 py-1 text-[11px] font-semibold text-slate-950 hover:bg-accent-400">
              Upgrade
            </Link>
          )}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/profile" className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition-colors hover:border-slate-600 hover:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-50">
            Profile completeness
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Help serious candidates understand you clearly.
          </p>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>{data.profileCompleteness.percentage}% complete</span>
              <span>{data.profileCompleteness.completedFields}/{data.profileCompleteness.totalFields} fields</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-accent-500 transition-all"
                style={{ width: `${data.profileCompleteness.percentage}%` }}
              />
            </div>
          </div>
          <button className="mt-4 inline-flex items-center text-xs font-semibold text-accent-200 group-hover:text-accent-100">
            Complete your profile →
          </button>
        </Link>

        <Link href="/messages" className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition-colors hover:border-slate-600 hover:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-50">Messages</h2>
          <p className="mt-1 text-xs text-slate-400">
            Stay on top of conversations.
          </p>
          <div className="mt-4 space-y-1 text-xs text-slate-300">
            <p>
              <span className="font-semibold text-accent-200">{data.messages.unreadConversations}</span> unread
              {data.messages.unreadConversations === 1 ? ' conversation' : ' conversations'}
            </p>
            <p>
              <span className="font-semibold text-accent-200">{data.messages.totalActiveThreads}</span> total active
              {data.messages.totalActiveThreads === 1 ? ' thread' : ' threads'}
            </p>
          </div>
          <button className="mt-4 inline-flex items-center text-xs font-semibold text-accent-200 group-hover:text-accent-100">
            Go to inbox →
          </button>
        </Link>

        <Link href="/search" className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition-colors hover:border-slate-600 hover:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-50">
            Profiles to explore
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Start discovering compatible profiles.
          </p>
          <p className="mt-4 text-xs text-slate-300">
            <span className="font-semibold text-accent-200">{data.matchCount}</span> profiles
            currently available.
          </p>
          <button className="mt-4 inline-flex items-center text-xs font-semibold text-accent-200 group-hover:text-accent-100">
            Browse profiles →
          </button>
        </Link>
      </section>

      <section className="flex flex-wrap gap-3 border-y border-slate-800 py-4 text-xs sm:text-sm">
        <Link href="/profile" className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 font-semibold text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-800">
          Edit profile
        </Link>
        <Link href="/search" className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 font-semibold text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-800">
          Start a search
        </Link>
        <Link href="/favorites" className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 font-semibold text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-800">
          Favourites
        </Link>
        <Link href="/pricing" className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 font-semibold text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-800">
          Manage subscription
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-50">
          Next steps
        </h2>
        <ul className="space-y-2 text-xs text-slate-300 sm:text-sm">
          {data.profileCompleteness.percentage < 100 && (
            <li>• Complete your profile to increase your visibility and connect with serious matches.</li>
          )}
          <li>• Browse available profiles and save favourites to your wishlist.</li>
          {data.subscriptionStatus === 'free' && (
            <li>• Upgrade to premium to send messages and view more profiles.</li>
          )}
        </ul>
      </section>
    </div>
  );
}


export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-300">
            Member dashboard
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
            Assalamu alaikum, <span className="text-accent-200">[Name]</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Member since [date]. May Allah put barakah in your search.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5 text-xs text-slate-200">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="font-medium">Free member</span>
          <button className="rounded-full bg-accent-500 px-3 py-1 text-[11px] font-semibold text-slate-950 hover:bg-accent-400">
            Upgrade
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-sm font-semibold text-slate-50">
            Profile completeness
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Help serious candidates understand you clearly.
          </p>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>80% complete</span>
              <span>[x/ y] key fields</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-4/5 rounded-full bg-accent-500" />
            </div>
          </div>
          <button className="mt-4 inline-flex items-center text-xs font-semibold text-accent-200 hover:text-accent-100">
            Complete your profile
          </button>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-sm font-semibold text-slate-50">Messages</h2>
          <p className="mt-1 text-xs text-slate-400">
            Stay on top of conversations.
          </p>
          <div className="mt-4 space-y-1 text-xs text-slate-300">
            <p>
              <span className="font-semibold text-accent-200">2</span> unread
              conversations
            </p>
            <p>
              <span className="font-semibold text-accent-200">5</span> total active
              threads
            </p>
          </div>
          <button className="mt-4 inline-flex items-center text-xs font-semibold text-accent-200 hover:text-accent-100">
            Go to inbox
          </button>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-sm font-semibold text-slate-50">
            New matches / suggestions
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Profiles that align with your criteria.
          </p>
          <p className="mt-4 text-xs text-slate-300">
            <span className="font-semibold text-accent-200">X</span> profiles
            currently match your saved filters.
          </p>
          <button className="mt-4 inline-flex items-center text-xs font-semibold text-accent-200 hover:text-accent-100">
            View matches
          </button>
        </div>
      </section>

      <section className="flex flex-wrap gap-3 border-y border-slate-800 py-4 text-xs sm:text-sm">
        <button className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 font-semibold text-slate-100 hover:border-slate-500">
          Edit profile
        </button>
        <button className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 font-semibold text-slate-100 hover:border-slate-500">
          Start a search
        </button>
        <button className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 font-semibold text-slate-100 hover:border-slate-500">
          Favourites
        </button>
        <button className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 font-semibold text-slate-100 hover:border-slate-500">
          Manage subscription
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-50">
          Recent activity
        </h2>
        <ul className="space-y-2 text-xs text-slate-300 sm:text-sm">
          <li>• New profiles added that match your saved filters.</li>
          <li>• Recent visitors (coming in a later phase).</li>
        </ul>
      </section>
    </div>
  );
}


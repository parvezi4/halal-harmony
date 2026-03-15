import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-slate-950">
              HH
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Halal Harmony
            </span>
          </Link>
        </header>

        <main className="space-y-8">
          <section className="max-w-2xl">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Simple, transparent pricing
            </h1>
            <p className="mt-2 text-sm text-slate-300 sm:text-base">
              Start with a free account to set up your profile. When you are
              ready to actively search and message, choose a Premium plan that
              suits your timeline.
            </p>
          </section>

          <section className="grid gap-6 sm:grid-cols-[minmax(0,2fr),minmax(0,3fr)]">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-slate-50 sm:text-base">
                Free member
              </h2>
              <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                Ideal while you are exploring the platform.
              </p>
              <p className="mt-4 text-2xl font-semibold text-slate-100">
                $0
                <span className="ml-1 text-xs font-normal text-slate-400">
                  / forever
                </span>
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300 sm:text-sm">
                <li>• Create and complete your profile</li>
                <li>• Browse a limited number of profiles</li>
                <li>• Save basic search filters</li>
                <li>• See how the platform works</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-accent-400/70 bg-slate-900/90 p-5 sm:p-6">
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-50 sm:text-base">
                    Premium member
                  </h2>
                  <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                    Full access to search and messaging, within clear halal
                    boundaries.
                  </p>
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-300">
                  From $20/month
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-200">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-300">
                    Monthly
                  </p>
                  <p className="mt-1 text-lg font-semibold">$20</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Best for trying Premium for a short period.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-200">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-300">
                    Quarterly
                  </p>
                  <p className="mt-1 text-lg font-semibold">$54</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Around $18/month with a small discount.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-200">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-300">
                    6 months
                  </p>
                  <p className="mt-1 text-lg font-semibold">$96</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Around $16/month for a more committed search.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-200">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-300">
                    Annual
                  </p>
                  <p className="mt-1 text-lg font-semibold">$168</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Around $14/month, best value for long searches.
                  </p>
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-xs text-slate-200 sm:text-sm">
                <li>• Full profile views (respecting privacy settings)</li>
                <li>• Start and reply to conversations</li>
                <li>• Priority placement in search results</li>
                <li>• Access to saved filters and advanced search options</li>
              </ul>

              <div className="mt-5 flex flex-wrap gap-3 text-xs">
                <Link
                  href="/auth/register"
                  className="rounded-full bg-accent-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-accent-400"
                >
                  Get started
                </Link>
                <Link
                  href="/dashboard/billing"
                  className="rounded-full border border-slate-700 bg-slate-950 px-5 py-2 text-xs font-semibold text-slate-100 hover:border-slate-500"
                >
                  Manage subscription (when logged in)
                </Link>
              </div>

              <p className="mt-4 text-[11px] text-slate-400">
                Payments are processed securely via Stripe. You can cancel
                renewal at any time; your access continues until the end of the
                paid period.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}


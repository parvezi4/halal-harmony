import Link from "next/link";

function PrimaryButton({
  children,
  href
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm hover:bg-accent-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300"
    >
      {children}
    </Link>
  );
}

function GhostButton({
  children,
  href
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-slate-400 hover:bg-slate-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
    >
      {children}
    </Link>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      {/* Top nav */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-500 text-sm font-bold text-slate-950">
              HH
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-slate-50">
                Halal Harmony
              </span>
              <span className="text-[11px] text-slate-400">
                Serious halal matrimony
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-2 sm:gap-3">
            <GhostButton href="/auth/login">Login</GhostButton>
            <PrimaryButton href="/auth/register">Sign up</PrimaryButton>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-slate-800/60">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[3fr,2fr] lg:items-center lg:px-8 lg:py-16">
            <div className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-300/80">
                Bismillah
              </p>
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl lg:text-5xl">
                Serious halal matrimony, guided by{" "}
                <span className="bg-gradient-to-r from-accent-300 via-accent-400 to-accent-200 bg-clip-text text-transparent">
                  Islamic values
                </span>
                .
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Halal Harmony connects practicing Muslims seeking marriage, not
                casual dating. Built around modesty, wali involvement, and clear
                halal guidelines so you can focus on what matters.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <PrimaryButton href="/auth/register">Get started</PrimaryButton>
                <GhostButton href="#how-it-works">Learn more</GhostButton>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-slate-400 sm:text-[13px]">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
                  No casual dating, no swiping culture
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
                  Profiles reviewed for modesty and safety
                </div>
              </div>
            </div>

            {/* Simple card mirroring wireframe hero block */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-[0_0_40px_rgba(15,23,42,0.8)] sm:p-6">
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-slate-50 sm:text-base">
                  Start your halal journey
                </h2>
                <p className="text-xs text-slate-300 sm:text-sm">
                  Create a profile in minutes and let our filters help you find
                  practising Muslims aligned with your values and intentions.
                </p>
                <ul className="space-y-2 text-xs text-slate-300 sm:text-sm">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-400" />
                    <span>Create a modest, reviewable profile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-400" />
                    <span>Search within halal-compatible criteria</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-400" />
                    <span>Message with clear, modesty-first rules</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="border-b border-slate-800/60 bg-slate-950"
        >
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
            <h2 className="text-center text-lg font-semibold tracking-tight text-slate-50 sm:text-2xl">
              How it works
            </h2>
            <p className="mt-2 text-center text-sm text-slate-300 sm:text-base">
              A simple, guided flow that keeps your search focused on nikah,
              not casual chat.
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-300">
                  Step 1
                </p>
                <h3 className="mt-2 text-sm font-semibold text-slate-50 sm:text-base">
                  Create your profile
                </h3>
                <p className="mt-2 text-xs text-slate-300 sm:text-sm">
                  Share your Islamic background, family values, and preferences
                  while keeping personal contact details private.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-300">
                  Step 2
                </p>
                <h3 className="mt-2 text-sm font-semibold text-slate-50 sm:text-base">
                  Search within halal guidelines
                </h3>
                <p className="mt-2 text-xs text-slate-300 sm:text-sm">
                  Use filters for practising level, location, marital status,
                  and more—always opposite-gender and marriage-focused.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-300">
                  Step 3
                </p>
                <h3 className="mt-2 text-sm font-semibold text-slate-50 sm:text-base">
                  Communicate with modesty
                </h3>
                <p className="mt-2 text-xs text-slate-300 sm:text-sm">
                  Subscribers can start conversations within clear etiquette and
                  with encouragement to involve wali/guardians early.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust / Islamic compliance */}
        <section className="border-b border-slate-800/60 bg-slate-950">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[3fr,2fr] lg:items-center">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-50 sm:text-2xl">
                  Designed around Islamic guidelines and modesty.
                </h2>
                <p className="mt-2 text-sm text-slate-300 sm:text-base">
                  Halal Harmony is not a dating app. It is a focused tool to
                  help practising Muslims seek marriage in a structured,
                  dignified way.
                </p>
                <ul className="mt-5 space-y-3 text-sm text-slate-200">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-400" />
                    <span>No public contact details; profiles are reviewed for
                    modesty and safety.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-400" />
                    <span>Optional wali/guardian contact stored privately for
                    appropriate involvement.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-400" />
                    <span>Clear behaviour guidelines and reporting tools for
                    haram or abusive conduct.</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-5 text-xs text-emerald-100 sm:text-sm">
                <p className="font-semibold text-emerald-200">
                  “Whoever fears Allah, He will make for him a way out.”
                </p>
                <p className="mt-1 text-emerald-200/80">
                  — Qur&apos;an 65:2-3
                </p>
                <p className="mt-4 text-emerald-100/80">
                  Tools are means, not ends. Our aim is to support Muslims in
                  seeking halal marriage while remembering that rizq, spouses,
                  and outcomes are ultimately from Allah.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing teaser */}
        <section className="border-b border-slate-800/60 bg-slate-950">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
            <div className="flex flex-col items-center text-center">
              <h2 className="text-lg font-semibold tracking-tight text-slate-50 sm:text-2xl">
                Simple, transparent pricing
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                Start for free, then upgrade when you are ready to actively
                search and message within clear halal boundaries.
              </p>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-[minmax(0,2fr),minmax(0,3fr)]">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
                <h3 className="text-sm font-semibold text-slate-50 sm:text-base">
                  Free member
                </h3>
                <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                  Explore the platform and set up your profile.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-slate-300 sm:text-sm">
                  <li>• Create and complete your profile</li>
                  <li>• Browse a limited number of profiles</li>
                  <li>• Save basic search filters</li>
                  <li>• Upgrade anytime to start messaging</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-accent-400/70 bg-slate-900/80 p-5 sm:p-6">
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-50 sm:text-base">
                      Premium member
                    </h3>
                    <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                      Unlock full search and messaging features.
                    </p>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-300">
                    From $20/month
                  </p>
                </div>
                <ul className="mt-4 space-y-2 text-xs text-slate-200 sm:text-sm">
                  <li>• Full profile views within privacy settings</li>
                  <li>• Start and reply to conversations</li>
                  <li>• Priority placement in search results</li>
                  <li>• Flexible billing: monthly, quarterly, semiannual, annual</li>
                </ul>
                <div className="mt-5">
                  <PrimaryButton href="/pricing">View plans</PrimaryButton>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Halal Harmony. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/about" className="hover:text-slate-200">
              About
            </Link>
            <Link href="/guidelines" className="hover:text-slate-200">
              Islamic guidelines
            </Link>
            <Link href="/faq" className="hover:text-slate-200">
              FAQ
            </Link>
            <Link href="/terms" className="hover:text-slate-200">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-slate-200">
              Privacy
            </Link>
            <Link href="/contact" className="hover:text-slate-200">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}


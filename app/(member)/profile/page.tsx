export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
          Your profile
        </h1>
        <p className="mt-1 text-xs text-slate-400 sm:text-sm">
          Keep your information clear, modest, and focused on marriage.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,3fr)]">
        <div className="space-y-4">
          <div className="flex flex-col items-center rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-400">
              Photo
            </div>
            <button className="mt-3 rounded-full border border-slate-700 px-4 py-1.5 text-xs font-semibold text-slate-100 hover:border-slate-500">
              Upload / Manage photos
            </button>
            <p className="mt-2 text-[11px] text-slate-400 text-center">
              Please follow modesty guidelines. Photos are reviewed before being
              visible to others.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-50">
                  [Alias], [Age / Age range]
                </h2>
                <p className="text-xs text-slate-400">
                  [City/Region], [Country]
                </p>
              </div>
              <span className="inline-flex items-center rounded-full border border-amber-400/50 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-200">
                Pending review
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <h3 className="text-sm font-semibold text-slate-50">About me</h3>
              <textarea
                className="mt-2 h-24 w-full resize-none rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
                placeholder="Share a brief, modest introduction focused on your deen, character, and what you are seeking in marriage."
              />
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-50">
                Islamic background
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">
                    Practicing level
                  </label>
                  <select className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none">
                    <option value="">Select...</option>
                    <option>Striving to be consistent</option>
                    <option>Practicing and stable</option>
                    <option>Newly practicing / returning</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Prayer</label>
                  <select className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none">
                    <option value="">Select...</option>
                    <option>Prays 5 times daily</option>
                    <option>Usually prays, sometimes misses</option>
                    <option>Working towards consistency</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">
                    Hijab / beard
                  </label>
                  <select className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none">
                    <option value="">Prefer not to say</option>
                    <option>Observes hijab</option>
                    <option>Has beard</option>
                    <option>No hijab / beard</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">
                    Madhhab / manhaj (optional)
                  </label>
                  <input
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
                    placeholder="e.g. Hanafi, Salafi, etc."
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-50">
                Personal & family
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">
                    Marital status
                  </label>
                  <select className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none">
                    <option value="">Select...</option>
                    <option>Never married</option>
                    <option>Divorced</option>
                    <option>Widowed</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Children</label>
                  <select className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none">
                    <option value="">Select...</option>
                    <option>No children</option>
                    <option>Have children living with me</option>
                    <option>Have children not living with me</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Education</label>
                  <input
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
                    placeholder="e.g. BSc Computer Science"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Profession</label>
                  <input
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
                    placeholder="e.g. Software engineer"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-300">
                  Family background
                </label>
                <textarea
                  className="mt-1 h-20 w-full resize-none rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
                  placeholder="Share relevant information about your family, culture, and expectations."
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-50">
                Preferences
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">
                    Desired age range
                  </label>
                  <input
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
                    placeholder="e.g. 25–32"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">
                    Location preference
                  </label>
                  <input
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
                    placeholder="e.g. Same country, open to relocation"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-300">
                  What you are seeking
                </label>
                <textarea
                  className="mt-1 h-20 w-full resize-none rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
                  placeholder="Describe the qualities and deen you are seeking in a spouse."
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-50">
                Wali / guardian (for sisters)
              </h3>
              <p className="text-[11px] text-slate-400">
                This information is private and not displayed on your public
                profile. It helps us encourage candidates to involve your wali
                appropriately.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
                  placeholder="Wali name"
                />
                <input
                  className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
                  placeholder="Relationship"
                />
                <input
                  className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
                  placeholder="Contact details"
                />
              </div>
            </section>
          </div>
        </div>
      </section>

      <footer className="flex flex-wrap gap-3 border-t border-slate-800 pt-4">
        <button className="rounded-full bg-accent-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-accent-400">
          Save changes
        </button>
        <button className="rounded-full border border-slate-700 bg-slate-900 px-5 py-2 text-xs font-semibold text-slate-100 hover:border-slate-500">
          Preview as others see
        </button>
      </footer>
    </div>
  );
}


export default function SearchPage() {
  return (
    <div className="space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
          Search
        </h1>
        <p className="mt-1 text-xs text-slate-400 sm:text-sm">
          Search within halal-compatible criteria. Results are limited for free
          members.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,3fr)]">
        {/* Filters */}
        <aside className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-sm font-semibold text-slate-50">Filters</h2>

          <div className="space-y-3 text-xs text-slate-200">
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Gender</label>
              <select className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none">
                <option>Opposite to my gender</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Age range</label>
              <input
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
                placeholder="e.g. 25–32"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Country</label>
              <input
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
                placeholder="e.g. United Kingdom"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">City / Region</label>
              <input
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
                placeholder="e.g. London"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Marital status</label>
              <select className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none">
                <option value="">Any</option>
                <option>Never married</option>
                <option>Divorced</option>
                <option>Widowed</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Practicing level</label>
              <select className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none">
                <option value="">Any</option>
                <option>Striving to be consistent</option>
                <option>Practicing and stable</option>
                <option>Newly practicing / returning</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Hijab / beard</label>
              <select className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none">
                <option value="">Any</option>
                <option>Observes hijab</option>
                <option>Has beard</option>
                <option>No hijab / beard</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Smoking</label>
              <select className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none">
                <option value="">Any</option>
                <option>Does not smoke</option>
                <option>Smokes occasionally</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Education level</label>
              <input
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
                placeholder="e.g. Bachelor, Masters"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Profession</label>
              <input
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
                placeholder="e.g. Teacher, Engineer"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">
                Willing to relocate
              </label>
              <select className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none">
                <option value="">Any</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <button className="rounded-full bg-accent-500 px-4 py-1.5 font-semibold text-slate-950 hover:bg-accent-400">
              Apply filters
            </button>
            <button className="rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5 font-semibold text-slate-100 hover:border-slate-500">
              Clear
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3 text-[11px] text-slate-400">
            <button className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 font-semibold text-slate-100 hover:border-slate-500">
              Save this search
            </button>
            <button className="text-[11px] font-semibold text-accent-200 hover:text-accent-100">
              My filters ▾
            </button>
          </div>
        </aside>

        {/* Results */}
        <section className="space-y-4">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-300 sm:text-sm">
              Showing{" "}
              <span className="font-semibold text-accent-200">X</span> matching
              profiles.
            </p>
            <select className="h-8 rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-[11px] text-slate-100 focus:border-accent-400 focus:outline-none">
              <option>Sort by: Most relevant</option>
              <option>Newest profiles</option>
              <option>Nearest location</option>
            </select>
          </header>

          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <article
                key={idx}
                className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-3 sm:p-4"
              >
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] text-slate-400">
                  Photo
                </div>
                <div className="flex flex-1 flex-col gap-1 text-xs sm:text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-50 sm:text-base">
                        [Alias], [Age / range]
                      </h2>
                      <p className="text-[11px] text-slate-400 sm:text-xs">
                        [City/Region], [Country]
                      </p>
                    </div>
                    <button className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[11px] font-semibold text-slate-100 hover:border-slate-500">
                      ♥ Favourite
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-300 sm:text-xs">
                    Practising level: [label] • Prayer: [label] • Hijab/beard:
                    [label]
                  </p>
                  <div className="mt-1">
                    <button className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-950 hover:bg-slate-200">
                      View profile
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-center gap-1 text-xs text-slate-300">
            <button className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] hover:border-slate-500">
              ◀ Prev
            </button>
            <button className="h-7 w-7 rounded-full bg-accent-500 text-[11px] font-semibold text-slate-950">
              1
            </button>
            <button className="h-7 w-7 rounded-full border border-slate-700 bg-slate-900 text-[11px] hover:border-slate-500">
              2
            </button>
            <button className="h-7 w-7 rounded-full border border-slate-700 bg-slate-900 text-[11px] hover:border-slate-500">
              3
            </button>
            <span className="px-1 text-[11px]">...</span>
            <button className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] hover:border-slate-500">
              Next ▶
            </button>
          </div>
        </section>
      </section>
    </div>
  );
}


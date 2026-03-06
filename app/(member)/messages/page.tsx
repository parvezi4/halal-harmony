export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
          Messages
        </h1>
        <p className="mt-1 text-xs text-slate-400 sm:text-sm">
          Only subscribers can start new conversations. Keep all communication
          halal and respectful.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-[11px] text-amber-100">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
          <span>
            Remember to involve your wali/guardians early where appropriate.
          </span>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,3fr)]">
        {/* Conversation list */}
        <aside className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <header className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-50">Inbox</h2>
            <div className="flex gap-1 rounded-full border border-slate-700 bg-slate-950 p-1 text-[11px] text-slate-200">
              <button className="rounded-full bg-slate-800 px-2 py-0.5">
                All
              </button>
              <button className="rounded-full px-2 py-0.5 hover:bg-slate-800">
                Unread
              </button>
              <button className="rounded-full px-2 py-0.5 hover:bg-slate-800">
                Favourited
              </button>
            </div>
          </header>

          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <button
                key={idx}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-left text-xs text-slate-200 hover:border-slate-600"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] text-slate-400">
                  A
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-50">[Alias]</p>
                    <span className="text-[10px] text-slate-400">2h ago</span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-300">
                    Last message snippet goes here with a short preview…
                  </p>
                </div>
                <span className="h-2 w-2 rounded-full bg-accent-400" />
              </button>
            ))}
          </div>
        </aside>

        {/* Conversation view */}
        <section className="flex min-h-[260px] flex-col rounded-2xl border border-slate-800 bg-slate-900/70">
          <header className="flex items-center justify-between gap-2 border-b border-slate-800 px-4 py-3 text-xs text-slate-200">
            <div className="flex items-center gap-2">
              <button className="rounded-full border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] hover:border-slate-500">
                &lt; Back
              </button>
              <p className="font-semibold">[Alias]</p>
            </div>
            <button className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[11px] hover:border-slate-500">
              ⋮
            </button>
          </header>

          <div className="border-b border-slate-800 bg-slate-950/80 px-4 py-2 text-[11px] text-slate-300">
            Remember: keep communication halal. Avoid unnecessary free-mixing
            and involve your wali where appropriate.
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-xs">
            <div className="flex justify-start">
              <div className="max-w-[70%] rounded-2xl rounded-bl-sm bg-slate-800 px-3 py-2 text-slate-100">
                Assalamu alaikum, I saw your profile and would like to know
                more, in shaa Allah.
              </div>
            </div>
            <div className="flex justify-end">
              <div className="max-w-[70%] rounded-2xl rounded-br-sm bg-accent-500 px-3 py-2 text-slate-950">
                Wa alaikum assalam, thank you for your message…
              </div>
            </div>
            <p className="pt-1 text-center text-[10px] text-slate-500">
              Today • 14:23
            </p>
          </div>

          <form className="flex flex-col gap-2 border-t border-slate-800 bg-slate-950/90 px-4 py-3">
            <textarea
              className="h-16 w-full resize-none rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
              placeholder="Type your message…"
            />
            <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
              <p>
                Free members may be limited in how many new conversations they
                can start.
              </p>
              <button className="rounded-full bg-accent-500 px-4 py-1.5 text-[11px] font-semibold text-slate-950 hover:bg-accent-400">
                Send
              </button>
            </div>
          </form>
        </section>
      </section>
    </div>
  );
}


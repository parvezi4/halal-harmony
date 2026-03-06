export default function FaqPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Frequently asked questions
        </h1>
        <div className="mt-6 space-y-5 text-sm text-slate-300">
          <div>
            <h2 className="text-sm font-semibold text-slate-50">
              Is this a dating app?
            </h2>
            <p className="mt-1">
              No. Halal Harmony is for Muslims seeking marriage only. The flows
              and rules are designed to avoid casual, entertainment-focused
              usage.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-50">
              Who can see my personal details?
            </h2>
            <p className="mt-1">
              Your profile hides direct contact details and can blur certain
              information (like exact age or city) depending on your settings.
              Only registered members can view profiles, and photos may be
              limited to subscribers.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-50">
              How do subscriptions work?
            </h2>
            <p className="mt-1">
              You can start with a free account. Premium subscriptions unlock
              messaging and more search capabilities and are billed via Stripe
              on a recurring basis until cancelled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export type PremiumBillingInterval = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

type PlanOption = {
  interval: PremiumBillingInterval;
  title: string;
  amountLabel: string;
  helper: string;
};

const PLAN_OPTIONS: PlanOption[] = [
  {
    interval: 'monthly',
    title: 'Monthly',
    amountLabel: '$20',
    helper: 'Best for trying Premium for a short period.',
  },
  {
    interval: 'quarterly',
    title: 'Quarterly',
    amountLabel: '$54',
    helper: 'Around $18/month with a small discount.',
  },
  {
    interval: 'semiannual',
    title: '6 months',
    amountLabel: '$96',
    helper: 'Around $16/month for a more committed search.',
  },
  {
    interval: 'annual',
    title: 'Annual',
    amountLabel: '$168',
    helper: 'Around $14/month, best value for long searches.',
  },
];

export function PricingClient(props: {
  isAuthenticated: boolean;
  hasActivePaidMembership: boolean;
  currentInterval: PremiumBillingInterval | null;
  currentPeriodEnd: string | null;
}) {
  const { isAuthenticated, hasActivePaidMembership, currentInterval, currentPeriodEnd } = props;
  const router = useRouter();
  const [selectedInterval, setSelectedInterval] = useState<PremiumBillingInterval>(
    currentInterval || 'monthly'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedPlan = PLAN_OPTIONS.find((item) => item.interval === selectedInterval) || PLAN_OPTIONS[0];
  const freePlanIsActive = !hasActivePaidMembership;
  const isCurrentPaidPlanSelected = hasActivePaidMembership && currentInterval === selectedInterval;

  const ctaLabel = useMemo(() => {
    if (!isAuthenticated) {
      return 'Login to continue';
    }

    if (isCurrentPaidPlanSelected) {
      return 'Current active plan';
    }

    if (hasActivePaidMembership) {
      return `Schedule ${selectedPlan.title} from next billing cycle`;
    }

    return `Pay ${selectedPlan.amountLabel} and upgrade`;
  }, [hasActivePaidMembership, isAuthenticated, isCurrentPaidPlanSelected, selectedPlan.amountLabel, selectedPlan.title]);

  async function handleSubmit() {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (isCurrentPaidPlanSelected) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = hasActivePaidMembership
        ? '/api/stripe/change-plan'
        : '/api/stripe/checkout';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ interval: selectedInterval }),
      });

      const payload = (await response.json()) as {
        success: boolean;
        url?: string;
        message?: string;
        error?: string;
      };

      if (response.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (!response.ok || !payload.success) {
        setError(payload.error || 'Unable to process plan selection right now.');
        return;
      }

      if (payload.url) {
        window.location.href = payload.url;
        return;
      }

      setSuccess(
        payload.message ||
          'Plan change scheduled. It will take effect from your next billing cycle.'
      );
    } catch {
      setError('Unable to process plan selection right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Membership plans</h1>
        <p className="mt-2 text-sm text-slate-300 sm:text-base">
          Choose the plan that fits your timeline. Free members can upgrade anytime. Paid members can schedule
          a change for the next billing cycle with no mid-cycle refunds.
        </p>
      </section>

      <section className="grid gap-6 sm:grid-cols-[minmax(0,2fr),minmax(0,3fr)]">
        <div
          className={`rounded-2xl border p-5 sm:p-6 ${
            freePlanIsActive
              ? 'border-accent-400 bg-slate-900/90'
              : 'border-slate-800 bg-slate-900/80'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-50 sm:text-base">Free member</h2>
            {freePlanIsActive ? (
              <span className="rounded-full border border-accent-300 bg-accent-500/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent-200">
                Current plan
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-300 sm:text-sm">Ideal while you are exploring the platform.</p>
          <p className="mt-4 text-2xl font-semibold text-slate-100">
            $0
            <span className="ml-1 text-xs font-normal text-slate-400">/ forever</span>
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
              <h2 className="text-sm font-semibold text-slate-50 sm:text-base">Premium member</h2>
              <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                Full access to search and messaging, within clear halal boundaries.
              </p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-300">From $20/month</p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {PLAN_OPTIONS.map((plan) => {
              const isSelected = selectedInterval === plan.interval;
              const isCurrent = hasActivePaidMembership && currentInterval === plan.interval;

              return (
                <button
                  key={plan.interval}
                  type="button"
                  onClick={() => setSelectedInterval(plan.interval)}
                  className={`rounded-xl border p-3 text-left text-xs transition ${
                    isSelected
                      ? 'border-accent-400 bg-slate-900 text-slate-100'
                      : 'border-slate-800 bg-slate-950/70 text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-300">{plan.title}</p>
                    {isCurrent ? (
                      <span className="rounded-full border border-accent-300 bg-accent-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent-200">
                        Current
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-lg font-semibold">{plan.amountLabel}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{plan.helper}</p>
                </button>
              );
            })}
          </div>

          <ul className="mt-4 space-y-2 text-xs text-slate-200 sm:text-sm">
            <li>• Full profile views (respecting privacy settings)</li>
            <li>• Start and reply to conversations</li>
            <li>• Priority placement in search results</li>
            <li>• Access to saved filters and advanced search options</li>
          </ul>

          <div className="mt-5">
            <button
              type="button"
              onClick={() => {
                void handleSubmit();
              }}
              disabled={loading || isCurrentPaidPlanSelected}
              className="rounded-full bg-accent-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Processing...' : ctaLabel}
            </button>
          </div>

          {error ? (
            <p className="mt-3 rounded-md border border-red-800 bg-red-900/30 px-3 py-2 text-xs text-red-200">{error}</p>
          ) : null}

          {success ? (
            <p className="mt-3 rounded-md border border-green-800 bg-green-900/20 px-3 py-2 text-xs text-green-200">{success}</p>
          ) : null}

          <p className="mt-4 text-[11px] text-slate-400">
            Payments are processed securely via Stripe. The current paid period is non-refundable. Any plan change is applied on the next billing cycle.
            {currentPeriodEnd ? ` Current cycle ends on ${new Date(currentPeriodEnd).toLocaleDateString('en-GB')}.` : ''}
          </p>
        </div>
      </section>
    </div>
  );
}

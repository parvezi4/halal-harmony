import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import Footer from '@/app/components/Footer';
import LogoutButton from '@/app/(member)/LogoutButton';
import { MessagesCounter } from '@/app/(member)/messages/MessagesCounter';
import { PricingClient, type PremiumBillingInterval } from './PricingClient';

function mapSubscriptionToInterval(
  subscription: {
    plan: { durationDays: number; stripePriceId: string } | null;
  } | null
): PremiumBillingInterval | null {
  if (!subscription?.plan) {
    return null;
  }

  const duration = subscription.plan.durationDays;
  if (duration <= 31) return 'monthly';
  if (duration <= 93) return 'quarterly';
  if (duration <= 186) return 'semiannual';
  return 'annual';
}

export default async function PricingPage() {
  const session = (await getServerSession(authOptions)) as
    | (Session & { user: { id: string; role: string } })
    | null;

  const latestSubscription = session?.user?.id
    ? await prisma.subscription.findFirst({
        where: { userId: session.user.id },
        include: {
          plan: {
            select: {
              name: true,
              durationDays: true,
              stripePriceId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    : null;

  const hasActivePaidMembership = Boolean(
    latestSubscription &&
      latestSubscription.status === 'ACTIVE' &&
      latestSubscription.endDate > new Date()
  );

  const currentInterval = mapSubscriptionToInterval(latestSubscription);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href={session?.user ? '/dashboard' : '/'} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-slate-950">
              HH
            </div>
            <span className="text-sm font-semibold tracking-tight">Halal Harmony</span>
          </Link>

          {session?.user ? (
            <nav className="flex items-center gap-4 text-xs sm:text-sm">
              <Link href="/dashboard" className="text-slate-200 hover:text-accent-200">
                Home
              </Link>
              <Link href="/search" className="text-slate-200 hover:text-accent-200">
                Search
              </Link>
              <Link href="/favorites" className="text-slate-200 hover:text-accent-200">
                Favorites
              </Link>
              <Link href="/messages" className="relative text-slate-200 hover:text-accent-200">
                Messages
                <MessagesCounter />
              </Link>
              <Link href="/profile" className="text-slate-200 hover:text-accent-200">
                Profile
              </Link>
              <Link href="/dashboard/billing" className="text-slate-200 hover:text-accent-200">
                Billing
              </Link>
              <div className="ml-2 border-l border-slate-700" />
              <LogoutButton />
            </nav>
          ) : (
            <nav className="flex items-center gap-3 text-xs sm:text-sm">
              <Link href="/auth/login" className="rounded-full border border-slate-700 px-4 py-2 font-semibold text-slate-100 hover:border-slate-500">
                Login
              </Link>
              <Link href="/auth/register" className="rounded-full bg-accent-500 px-4 py-2 font-semibold text-slate-950 hover:bg-accent-400">
                Sign up
              </Link>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <PricingClient
            isAuthenticated={Boolean(session?.user)}
            hasActivePaidMembership={hasActivePaidMembership}
            currentInterval={currentInterval}
            currentPeriodEnd={latestSubscription?.endDate.toISOString() ?? null}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}


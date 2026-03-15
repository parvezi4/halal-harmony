import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type Stripe from 'stripe';
import { authOptions } from '@/auth';
import { getPremiumPriceId, stripe } from '@/config/stripe';
import { prisma } from '@/lib/prisma';

const VALID_INTERVALS = ['monthly', 'quarterly', 'semiannual', 'annual'] as const;
type BillingInterval = (typeof VALID_INTERVALS)[number];

function isBillingInterval(value: unknown): value is BillingInterval {
  return typeof value === 'string' && VALID_INTERVALS.includes(value as BillingInterval);
}

export async function POST(req: Request) {
  try {
    const authSession = await getServerSession(authOptions);

    if (!authSession?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const interval = body?.interval;

    if (!isBillingInterval(interval)) {
      return NextResponse.json(
        { success: false, error: 'Invalid billing interval' },
        { status: 400 }
      );
    }

    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId: authSession.user.id,
        status: 'ACTIVE',
        endDate: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeSubscription?.stripeSubscriptionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active paid subscription found to change',
        },
        { status: 400 }
      );
    }

    const requestedPriceId = getPremiumPriceId(interval);
    const stripeSubscription = await stripe.subscriptions.retrieve(
      activeSubscription.stripeSubscriptionId
    );

    const firstItem = stripeSubscription.items.data[0];
    if (!firstItem?.id) {
      return NextResponse.json(
        { success: false, error: 'Unable to read current subscription item' },
        { status: 500 }
      );
    }

    if (firstItem.price?.id === requestedPriceId) {
      return NextResponse.json(
        { success: true, message: 'This plan is already active for your subscription.' },
        { status: 200 }
      );
    }

    const updated = await stripe.subscriptions.update(activeSubscription.stripeSubscriptionId, {
      items: [
        {
          id: firstItem.id,
          price: requestedPriceId,
        },
      ],
      proration_behavior: 'none',
    } as Stripe.SubscriptionUpdateParams);

    return NextResponse.json(
      {
        success: true,
        message: 'Plan change scheduled. It will apply on your next billing cycle.',
        effectiveAt: new Date(updated.current_period_end * 1000).toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error scheduling subscription plan change', error);
    return NextResponse.json(
      { success: false, error: 'Unable to schedule plan change' },
      { status: 500 }
    );
  }
}

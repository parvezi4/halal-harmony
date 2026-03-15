import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/config/stripe';
import {
  classifyPaymentFailure,
  queuePaymentCommunicationEvent,
} from '@/lib/subscription/communications';

type AppSubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status
): AppSubscriptionStatus {
  if (status === 'canceled') {
    return 'CANCELLED';
  }

  if (status === 'incomplete_expired') {
    return 'EXPIRED';
  }

  return 'ACTIVE';
}

function unixToDate(seconds: number) {
  return new Date(seconds * 1000);
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

async function upsertSubscriptionRecord(args: {
  userId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: AppSubscriptionStatus;
  startDate: Date;
  endDate: Date;
  stripePriceId?: string;
}) {
  const {
    userId,
    stripeCustomerId,
    stripeSubscriptionId,
    status,
    startDate,
    endDate,
    stripePriceId,
  } = args;

  const plan = stripePriceId
    ? await prisma.subscriptionPlan.findUnique({
        where: { stripePriceId },
        select: { id: true },
      })
    : null;

  let existing = null as Awaited<ReturnType<typeof prisma.subscription.findFirst>>;

  if (stripeSubscriptionId) {
    existing = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId },
    });
  }

  if (!existing && userId && stripeCustomerId) {
    existing = await prisma.subscription.findFirst({
      where: {
        userId,
        stripeCustomerId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (existing) {
    return prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status,
        startDate,
        endDate,
        planId: plan?.id,
        stripeCustomerId,
        stripeSubscriptionId,
      },
    });
  }

  if (!userId) {
    return null;
  }

  return prisma.subscription.create({
    data: {
      userId,
      planId: plan?.id,
      status,
      startDate,
      endDate,
      stripeCustomerId,
      stripeSubscriptionId,
    },
  });
}

async function syncFromStripeSubscription(
  stripeSubscription: Stripe.Subscription,
  fallbackUserId?: string,
  forcedStatus?: AppSubscriptionStatus
) {
  const intervalPriceId = stripeSubscription.items.data[0]?.price?.id;
  const userId =
    readString(stripeSubscription.metadata?.userId) ||
    fallbackUserId;

  return upsertSubscriptionRecord({
    userId,
    stripeCustomerId: readString(stripeSubscription.customer),
    stripeSubscriptionId: stripeSubscription.id,
    status: forcedStatus ?? mapStripeSubscriptionStatus(stripeSubscription.status),
    startDate: unixToDate(stripeSubscription.current_period_start),
    endDate: unixToDate(stripeSubscription.current_period_end),
    stripePriceId: intervalPriceId,
  });
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId =
    readString(session.client_reference_id) ||
    readString(session.metadata?.userId);

  const stripeSubscriptionId = readString(session.subscription);

  if (!stripeSubscriptionId) {
    return;
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  await syncFromStripeSubscription(stripeSubscription, userId, 'ACTIVE');

  if (userId) {
    await queuePaymentCommunicationEvent({
      type: 'SUBSCRIPTION_CONFIRMED',
      userId,
      subscriptionId: stripeSubscription.id,
      triggeredAt: new Date(),
      providerContext: {
        source: 'checkout.session.completed',
      },
    });
  }
}

async function handleSubscriptionEvent(
  stripeSubscription: Stripe.Subscription,
  forcedStatus?: AppSubscriptionStatus
) {
  await syncFromStripeSubscription(stripeSubscription, undefined, forcedStatus);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = readString(invoice.subscription);

  if (!subscriptionId) {
    return;
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  const persisted = await syncFromStripeSubscription(stripeSubscription);

  if (persisted?.userId) {
    await queuePaymentCommunicationEvent({
      type: 'SUBSCRIPTION_CONFIRMED',
      userId: persisted.userId,
      subscriptionId,
      invoiceId: invoice.id,
      triggeredAt: new Date(),
      providerContext: {
        source: 'invoice.payment_succeeded',
      },
    });
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = readString(invoice.subscription);

  if (!subscriptionId) {
    return;
  }

  const persisted = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
    orderBy: { createdAt: 'desc' },
  });

  if (!persisted) {
    return;
  }

  const reason = classifyPaymentFailure({
    providerCode: invoice.last_finalization_error?.code || null,
    retryable: true,
  });

  await queuePaymentCommunicationEvent({
    type: 'PAYMENT_FAILED',
    userId: persisted.userId,
    subscriptionId,
    invoiceId: invoice.id,
    reason,
    triggeredAt: new Date(),
    providerContext: {
      source: 'invoice.payment_failed',
      amountDue: invoice.amount_due,
      currency: invoice.currency,
    },
  });
}

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { success: false, error: 'Missing webhook signature or secret' },
        { status: 400 }
      );
    }

    const payload = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      console.error('Stripe webhook signature verification failed', error);
      return NextResponse.json(
        { success: false, error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionEvent(
          event.data.object as Stripe.Subscription,
          'CANCELLED'
        );
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        break;
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error('Error handling Stripe webhook', error);
    return NextResponse.json(
      { success: false, error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

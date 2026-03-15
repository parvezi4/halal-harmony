'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/config/stripe';

function isMissingStripeCustomerError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as {
    type?: string;
    code?: string;
    raw?: { code?: string; param?: string };
    message?: string;
  };

  const code = maybeError.code || maybeError.raw?.code;
  const message = maybeError.message?.toLowerCase() || '';

  return (
    code === 'resource_missing' &&
    (message.includes('no such customer') || maybeError.raw?.param === 'customer')
  );
}

type BillingHistoryResponse = {
  success: boolean;
  errors?: Record<string, string>;
  data?: {
    currentSubscription: {
      id: string;
      status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
      startDate: string;
      endDate: string;
      planName: string | null;
      stripeSubscriptionId: string | null;
      stripeCustomerId: string | null;
    } | null;
    invoices: Array<{
      id: string;
      amountDue: number;
      amountPaid: number;
      currency: string;
      status: string | null;
      createdAt: string;
      hostedInvoiceUrl: string | null;
      invoicePdfUrl: string | null;
    }>;
    subscriptionHistory: Array<{
      id: string;
      status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
      planName: string | null;
      startDate: string;
      endDate: string;
      createdAt: string;
    }>;
  };
};

type CancelAutoRenewResponse = {
  success: boolean;
  errors?: Record<string, string>;
  data?: {
    subscriptionId: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string;
  };
};

export async function getBillingHistory(
  limit = 10
): Promise<BillingHistoryResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, errors: { general: 'Unauthorized' } };
    }

    const [currentSubscription, allSubscriptions] = await Promise.all([
      prisma.subscription.findFirst({
        where: { userId: session.user.id },
        include: {
          plan: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.subscription.findMany({
        where: { userId: session.user.id },
        include: {
          plan: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    const subscriptionHistory = allSubscriptions.map((subscription) => ({
      id: subscription.id,
      status: subscription.status,
      planName: subscription.plan?.name || null,
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate.toISOString(),
      createdAt: subscription.createdAt.toISOString(),
    }));

    const parsedSubscription = currentSubscription
      ? {
          id: currentSubscription.id,
          status: currentSubscription.status,
          startDate: currentSubscription.startDate.toISOString(),
          endDate: currentSubscription.endDate.toISOString(),
          planName: currentSubscription.plan?.name || null,
          stripeSubscriptionId: currentSubscription.stripeSubscriptionId || null,
          stripeCustomerId: currentSubscription.stripeCustomerId || null,
        }
      : null;

    if (!currentSubscription?.stripeCustomerId) {
      return {
        success: true,
        data: {
          currentSubscription: parsedSubscription,
          invoices: [],
          subscriptionHistory,
        },
      };
    }

    let invoiceResult;
    try {
      invoiceResult = await stripe.invoices.list({
        customer: currentSubscription.stripeCustomerId,
        limit: Math.max(1, Math.min(limit, 50)),
      });
    } catch (error) {
      if (isMissingStripeCustomerError(error)) {
        return {
          success: true,
          data: {
            currentSubscription: parsedSubscription,
            invoices: [],
            subscriptionHistory,
          },
        };
      }

      console.warn('Stripe invoice fetch failed; falling back to empty billing history.', error);
      return {
        success: true,
        data: {
          currentSubscription: parsedSubscription,
          invoices: [],
          subscriptionHistory,
        },
      };
    }

    const invoices = invoiceResult.data.map((invoice) => ({
      id: invoice.id,
      amountDue: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      createdAt: new Date(invoice.created * 1000).toISOString(),
      hostedInvoiceUrl: invoice.hosted_invoice_url || null,
      invoicePdfUrl: invoice.invoice_pdf || null,
    }));

    return {
      success: true,
      data: {
        currentSubscription: parsedSubscription,
        invoices,
        subscriptionHistory,
      },
    };
  } catch (error) {
    console.error('Error fetching billing history:', error);
    return { success: false, errors: { general: 'Failed to fetch billing history' } };
  }
}

export async function cancelAutoRenew(): Promise<CancelAutoRenewResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, errors: { general: 'Unauthorized' } };
    }

    const currentSubscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
        endDate: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!currentSubscription?.stripeSubscriptionId) {
      return {
        success: false,
        errors: {
          general: 'No active renewable subscription found',
        },
      };
    }

    const updated = await stripe.subscriptions.update(
      currentSubscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    await prisma.subscription.update({
      where: { id: currentSubscription.id },
      data: {
        endDate: new Date(updated.current_period_end * 1000),
      },
    });

    return {
      success: true,
      data: {
        subscriptionId: updated.id,
        cancelAtPeriodEnd: Boolean(updated.cancel_at_period_end),
        currentPeriodEnd: new Date(updated.current_period_end * 1000).toISOString(),
      },
    };
  } catch (error) {
    console.error('Error cancelling auto-renew:', error);
    return { success: false, errors: { general: 'Failed to cancel auto-renew' } };
  }
}

'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/config/stripe';

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

    const currentSubscription = await prisma.subscription.findFirst({
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
    });

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
        },
      };
    }

    const invoiceResult = await stripe.invoices.list({
      customer: currentSubscription.stripeCustomerId,
      limit: Math.max(1, Math.min(limit, 50)),
    });

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

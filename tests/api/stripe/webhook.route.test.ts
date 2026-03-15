import { POST } from '@/app/api/stripe/webhook/route';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/config/stripe';
import {
  classifyPaymentFailure,
  queuePaymentCommunicationEvent,
} from '@/lib/subscription/communications';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    subscriptionPlan: {
      findUnique: jest.fn(),
    },
    subscription: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/config/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
    subscriptions: {
      retrieve: jest.fn(),
    },
  },
}));

jest.mock('@/lib/subscription/communications', () => ({
  classifyPaymentFailure: jest.fn(),
  queuePaymentCommunicationEvent: jest.fn(),
}));

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
    (queuePaymentCommunicationEvent as jest.Mock).mockResolvedValue({
      queued: true,
      reference: 'mock-ref',
    });
  });

  it('returns 400 when signature is missing', async () => {
    const request = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: 'payload',
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Missing webhook signature or secret');
  });

  it('returns 400 when signature verification fails', async () => {
    (stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
      throw new Error('bad signature');
    });

    const request = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'sig_123',
      },
      body: 'payload',
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid webhook signature');
  });

  it('syncs subscription on checkout.session.completed', async () => {
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123',
          client_reference_id: 'user_123',
          subscription: 'sub_123',
          metadata: { userId: 'user_123' },
        },
      },
    });

    (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({
      id: 'sub_123',
      customer: 'cus_123',
      status: 'active',
      current_period_start: 1700000000,
      current_period_end: 1702592000,
      metadata: {},
      items: {
        data: [
          {
            price: {
              id: 'price_monthly_123',
            },
          },
        ],
      },
    });

    (prisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue({ id: 'plan_123' });
    (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.subscription.create as jest.Mock).mockResolvedValue({ id: 'local_sub_123' });

    const request = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'sig_123',
      },
      body: 'payload',
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(prisma.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user_123',
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_123',
          status: 'ACTIVE',
        }),
      })
    );
    expect(queuePaymentCommunicationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SUBSCRIPTION_CONFIRMED',
        userId: 'user_123',
      })
    );
  });

  it('updates status to CANCELLED on customer.subscription.deleted', async () => {
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_123',
          customer: 'cus_123',
          status: 'canceled',
          current_period_start: 1700000000,
          current_period_end: 1702592000,
          metadata: { userId: 'user_123' },
          items: {
            data: [
              {
                price: {
                  id: 'price_monthly_123',
                },
              },
            ],
          },
        },
      },
    });

    (prisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue({ id: 'plan_123' });
    (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({ id: 'local_sub_123' });
    (prisma.subscription.update as jest.Mock).mockResolvedValue({ id: 'local_sub_123' });

    const request = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'sig_123',
      },
      body: 'payload',
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'CANCELLED',
        }),
      })
    );
  });

  it('queues communication on invoice.payment_failed for known subscription', async () => {
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'in_123',
          subscription: 'sub_123',
          amount_due: 2000,
          currency: 'usd',
          last_finalization_error: {
            code: 'insufficient_funds',
          },
        },
      },
    });

    (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
      id: 'local_sub_123',
      userId: 'user_123',
      stripeSubscriptionId: 'sub_123',
    });
    (classifyPaymentFailure as jest.Mock).mockReturnValue('BANK_DECLINE');

    const request = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'sig_123',
      },
      body: 'payload',
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(classifyPaymentFailure).toHaveBeenCalled();
    expect(queuePaymentCommunicationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'PAYMENT_FAILED',
        userId: 'user_123',
        subscriptionId: 'sub_123',
        invoiceId: 'in_123',
        reason: 'BANK_DECLINE',
      })
    );
  });
});

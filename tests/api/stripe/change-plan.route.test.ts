import { POST } from '@/app/api/stripe/change-plan/route';
import { getServerSession } from 'next-auth/next';
import { getPremiumPriceId, stripe } from '@/config/stripe';
import { prisma } from '@/lib/prisma';

jest.mock('@/auth', () => ({
  authOptions: {},
}));

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    subscription: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('@/config/stripe', () => ({
  getPremiumPriceId: jest.fn(),
  stripe: {
    subscriptions: {
      retrieve: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('POST /api/stripe/change-plan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/stripe/change-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval: 'monthly' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid interval', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', email: 'member@example.com' },
    });

    const request = new Request('http://localhost:3000/api/stripe/change-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval: 'weekly' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid billing interval');
  });

  it('returns 400 if no active paid subscription exists', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', email: 'member@example.com' },
    });
    (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/stripe/change-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval: 'annual' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('No active paid subscription found to change');
  });

  it('schedules plan change successfully', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', email: 'member@example.com' },
    });
    (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
      id: 'local-sub-1',
      stripeSubscriptionId: 'sub_123',
    });
    (getPremiumPriceId as jest.Mock).mockReturnValue('price_annual');
    (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({
      items: {
        data: [
          {
            id: 'si_123',
            price: { id: 'price_monthly' },
          },
        ],
      },
    });
    (stripe.subscriptions.update as jest.Mock).mockResolvedValue({
      id: 'sub_123',
      current_period_end: 1702592000,
    });

    const request = new Request('http://localhost:3000/api/stripe/change-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval: 'annual' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('Plan change scheduled');
    expect(stripe.subscriptions.update).toHaveBeenCalledWith(
      'sub_123',
      expect.objectContaining({
        proration_behavior: 'none',
        items: [
          expect.objectContaining({
            id: 'si_123',
            price: 'price_annual',
          }),
        ],
      })
    );
  });
});

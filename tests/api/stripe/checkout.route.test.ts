import { POST } from '@/app/api/stripe/checkout/route';
import { getServerSession } from 'next-auth/next';
import { getPremiumPriceId, stripe } from '@/config/stripe';

jest.mock('@/auth', () => ({
  authOptions: {},
}));

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/config/stripe', () => ({
  getPremiumPriceId: jest.fn(),
  stripe: {
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
  },
}));

describe('POST /api/stripe/checkout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  });

  it('returns 401 when user is not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval: 'monthly' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Unauthorized');
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('returns 400 when billing interval is invalid', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', email: 'member@example.com' },
    });

    const request = new Request('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval: 'weekly' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid billing interval');
    expect(getPremiumPriceId).not.toHaveBeenCalled();
  });

  it('creates checkout session and returns url', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', email: 'member@example.com' },
    });
    (getPremiumPriceId as jest.Mock).mockReturnValue('price_monthly_123');
    (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
      url: 'https://checkout.stripe.test/session_123',
    });

    const request = new Request('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval: 'monthly' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.url).toBe('https://checkout.stripe.test/session_123');
    expect(getPremiumPriceId).toHaveBeenCalledWith('monthly');
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        client_reference_id: 'user-1',
        customer_email: 'member@example.com',
        metadata: expect.objectContaining({
          userId: 'user-1',
          userEmail: 'member@example.com',
          interval: 'monthly',
        }),
      })
    );
  });

  it('returns 500 when stripe session creation fails', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', email: 'member@example.com' },
    });
    (getPremiumPriceId as jest.Mock).mockReturnValue('price_monthly_123');
    (stripe.checkout.sessions.create as jest.Mock).mockRejectedValue(new Error('stripe failed'));

    const request = new Request('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval: 'monthly' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Unable to create checkout session');
  });
});

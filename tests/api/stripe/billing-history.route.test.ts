import { GET } from '@/app/api/stripe/billing-history/route';
import { getBillingHistory } from '@/app/actions/subscription';

jest.mock('@/app/actions/subscription', () => ({
  getBillingHistory: jest.fn(),
}));

describe('GET /api/stripe/billing-history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns billing history when authorized', async () => {
    (getBillingHistory as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        currentSubscription: null,
        invoices: [],
        subscriptionHistory: [],
      },
    });

    const response = await GET(new Request('http://localhost:3000/api/stripe/billing-history?limit=5'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(getBillingHistory).toHaveBeenCalledWith(5);
  });

  it('returns 401 when unauthorized', async () => {
    (getBillingHistory as jest.Mock).mockResolvedValue({
      success: false,
      errors: { general: 'Unauthorized' },
    });

    const response = await GET(new Request('http://localhost:3000/api/stripe/billing-history'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns 500 for generic action failures', async () => {
    (getBillingHistory as jest.Mock).mockResolvedValue({
      success: false,
      errors: { general: 'Failed to fetch billing history' },
    });

    const response = await GET(new Request('http://localhost:3000/api/stripe/billing-history'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
  });
});

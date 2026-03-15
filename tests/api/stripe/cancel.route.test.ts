import { POST } from '@/app/api/stripe/cancel/route';
import { cancelAutoRenew } from '@/app/actions/subscription';

jest.mock('@/app/actions/subscription', () => ({
  cancelAutoRenew: jest.fn(),
}));

describe('POST /api/stripe/cancel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns success when cancel at period end is enabled', async () => {
    (cancelAutoRenew as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        subscriptionId: 'sub_123',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: '2026-04-01T00:00:00.000Z',
      },
    });

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.subscriptionId).toBe('sub_123');
  });

  it('returns 401 when unauthorized', async () => {
    (cancelAutoRenew as jest.Mock).mockResolvedValue({
      success: false,
      errors: { general: 'Unauthorized' },
    });

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns 400 when no active renewable subscription exists', async () => {
    (cancelAutoRenew as jest.Mock).mockResolvedValue({
      success: false,
      errors: { general: 'No active renewable subscription found' },
    });

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 500 for generic failures', async () => {
    (cancelAutoRenew as jest.Mock).mockResolvedValue({
      success: false,
      errors: { general: 'Failed to cancel auto-renew' },
    });

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
  });
});

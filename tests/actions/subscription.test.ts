import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/config/stripe';
import { cancelAutoRenew, getBillingHistory } from '@/app/actions/subscription';

jest.mock('next-auth/next');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    subscription: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));
jest.mock('@/config/stripe', () => ({
  stripe: {
    invoices: {
      list: jest.fn(),
    },
    subscriptions: {
      update: jest.fn(),
    },
  },
}));

const mockGetServerSession = getServerSession as jest.Mock;

describe('subscription actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBillingHistory', () => {
    it('returns unauthorized when no session exists', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const result = await getBillingHistory();

      expect(result.success).toBe(false);
      expect(result.errors?.general).toBe('Unauthorized');
    });

    it('returns empty invoices when no stripe customer is attached', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub_local_1',
        status: 'ACTIVE',
        startDate: new Date('2026-03-01T00:00:00.000Z'),
        endDate: new Date('2026-04-01T00:00:00.000Z'),
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        plan: { name: 'Premium Monthly' },
      });

      const result = await getBillingHistory();

      expect(result.success).toBe(true);
      expect(result.data?.invoices).toEqual([]);
      expect(stripe.invoices.list).not.toHaveBeenCalled();
    });

    it('returns invoices when stripe customer exists', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub_local_1',
        status: 'ACTIVE',
        startDate: new Date('2026-03-01T00:00:00.000Z'),
        endDate: new Date('2026-04-01T00:00:00.000Z'),
        stripeSubscriptionId: 'sub_stripe_1',
        stripeCustomerId: 'cus_123',
        plan: { name: 'Premium Monthly' },
      });
      (stripe.invoices.list as jest.Mock).mockResolvedValue({
        data: [
          {
            id: 'in_123',
            amount_due: 2000,
            amount_paid: 2000,
            currency: 'usd',
            status: 'paid',
            created: 1700000000,
            hosted_invoice_url: 'https://stripe.test/in_123',
            invoice_pdf: 'https://stripe.test/in_123.pdf',
          },
        ],
      });

      const result = await getBillingHistory();

      expect(result.success).toBe(true);
      expect(result.data?.invoices).toHaveLength(1);
      expect(stripe.invoices.list).toHaveBeenCalledWith({
        customer: 'cus_123',
        limit: 10,
      });
    });
  });

  describe('cancelAutoRenew', () => {
    it('returns unauthorized when no session exists', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const result = await cancelAutoRenew();

      expect(result.success).toBe(false);
      expect(result.errors?.general).toBe('Unauthorized');
    });

    it('returns error when no active renewable subscription exists', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await cancelAutoRenew();

      expect(result.success).toBe(false);
      expect(result.errors?.general).toBe('No active renewable subscription found');
    });

    it('sets cancel_at_period_end via Stripe and updates local subscription end date', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'local_sub_1',
        stripeSubscriptionId: 'sub_123',
      });
      (stripe.subscriptions.update as jest.Mock).mockResolvedValue({
        id: 'sub_123',
        cancel_at_period_end: true,
        current_period_end: 1702592000,
      });
      (prisma.subscription.update as jest.Mock).mockResolvedValue({ id: 'local_sub_1' });

      const result = await cancelAutoRenew();

      expect(result.success).toBe(true);
      expect(result.data?.subscriptionId).toBe('sub_123');
      expect(result.data?.cancelAtPeriodEnd).toBe(true);
      expect(stripe.subscriptions.update).toHaveBeenCalledWith('sub_123', {
        cancel_at_period_end: true,
      });
      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'local_sub_1' } })
      );
    });
  });
});

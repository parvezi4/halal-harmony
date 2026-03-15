import {
  createPaymentCommunicationLog,
  getPaymentCommunicationLogs,
} from '@/app/actions/admin/payments';
import { verifyAdminOrModerator } from '@/lib/admin/access';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    paymentCommunicationLog: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/admin/access', () => ({
  verifyAdminOrModerator: jest.fn(),
}));

const mockVerifyAdminOrModerator = verifyAdminOrModerator as jest.Mock;

describe('Admin Payment Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects payment log read when unauthorized', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

    const result = await getPaymentCommunicationLogs();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Not authorized to view payment communication logs');
    }
  });

  it('rejects payment log create when unauthorized', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({ authorized: false, userId: null, role: null });

    const result = await createPaymentCommunicationLog({
      memberEmail: 'member@example.com',
      eventType: 'PAYMENT_FAILED',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Not authorized to create payment communication logs');
    }
  });

  it('validates member email on create', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({ authorized: true, userId: 'admin-1', role: 'ADMIN' });

    const result = await createPaymentCommunicationLog({
      memberEmail: 'not-an-email',
      eventType: 'PAYMENT_FAILED',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Enter a valid member email');
    }
  });

  it('returns member not found when email has no user', async () => {
    const { prisma } = jest.requireMock('@/lib/prisma') as {
      prisma: {
        user: { findUnique: jest.Mock };
      };
    };

    mockVerifyAdminOrModerator.mockResolvedValue({ authorized: true, userId: 'admin-1', role: 'ADMIN' });
    prisma.user.findUnique.mockResolvedValue(null);

    const result = await createPaymentCommunicationLog({
      memberEmail: 'member@example.com',
      eventType: 'PAYMENT_FAILED',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Member not found for the provided email');
    }
  });

  it('creates payment communication log for valid input', async () => {
    const { prisma } = jest.requireMock('@/lib/prisma') as {
      prisma: {
        user: { findUnique: jest.Mock };
        paymentCommunicationLog: { create: jest.Mock };
      };
    };

    mockVerifyAdminOrModerator.mockResolvedValue({ authorized: true, userId: 'admin-1', role: 'ADMIN' });
    prisma.user.findUnique.mockResolvedValue({ id: 'member-1', email: 'member@example.com' });
    prisma.paymentCommunicationLog.create.mockResolvedValue({ id: 'log-1' });

    const result = await createPaymentCommunicationLog({
      memberEmail: 'member@example.com',
      eventType: 'PAYMENT_FAILED',
      reason: 'BANK_DECLINE',
      status: 'PENDING_FOLLOW_UP',
      note: 'Reached out via support channel',
    });

    expect(result.success).toBe(true);
    expect(prisma.paymentCommunicationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorId: 'admin-1',
          memberId: 'member-1',
          eventType: 'PAYMENT_FAILED',
          status: 'PENDING_FOLLOW_UP',
        }),
      })
    );
  });
});

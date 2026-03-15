import {
  classifyPaymentFailure,
  queuePaymentCommunicationEvent,
} from '@/lib/subscription/communications';

describe('payment communication placeholders', () => {
  it('classifies internal errors as SERVER_INTERNAL', () => {
    const reason = classifyPaymentFailure({ internalError: true });
    expect(reason).toBe('SERVER_INTERNAL');
  });

  it('classifies retryable provider errors as PROCESSOR_RETRYABLE', () => {
    const reason = classifyPaymentFailure({ retryable: true, providerCode: 'api_connection_error' });
    expect(reason).toBe('PROCESSOR_RETRYABLE');
  });

  it('classifies decline-like codes as BANK_DECLINE', () => {
    const reason = classifyPaymentFailure({ providerCode: 'insufficient_funds' });
    expect(reason).toBe('BANK_DECLINE');
  });

  it('returns deterministic queue reference payload', async () => {
    const date = new Date('2026-03-15T12:00:00.000Z');
    const result = await queuePaymentCommunicationEvent({
      type: 'PAYMENT_FAILED',
      userId: 'user_123',
      subscriptionId: 'sub_123',
      invoiceId: 'in_123',
      reason: 'BANK_DECLINE',
      providerContext: {
        provider: 'stripe',
      },
      triggeredAt: date,
    });

    expect(result.queued).toBe(true);
    expect(result.reference).toBe(`PAYMENT_FAILED:user_123:${date.getTime()}`);
  });
});

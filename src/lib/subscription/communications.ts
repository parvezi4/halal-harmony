export type PaymentFailureReason = 'BANK_DECLINE' | 'PROCESSOR_RETRYABLE' | 'SERVER_INTERNAL';

export type PaymentCommunicationEventType =
  | 'SUBSCRIPTION_CONFIRMED'
  | 'PAYMENT_FAILED'
  | 'ADMIN_OUTREACH_NOTE';

export interface PaymentCommunicationEvent {
  type: PaymentCommunicationEventType;
  userId: string;
  subscriptionId?: string;
  invoiceId?: string;
  reason?: PaymentFailureReason;
  // Keep provider metadata for debugging while user-visible copy stays safe and clear.
  providerContext?: Record<string, string | number | boolean | null>;
  triggeredAt: Date;
}

/**
 * Temporary classification helper for payment failures.
 *
 * This lets us keep consistent user/admin messaging now and plug in
 * outbound email delivery later without changing callers.
 */
export function classifyPaymentFailure(input: {
  providerCode?: string | null;
  retryable?: boolean;
  internalError?: boolean;
}): PaymentFailureReason {
  if (input.internalError) {
    return 'SERVER_INTERNAL';
  }

  if (input.retryable) {
    return 'PROCESSOR_RETRYABLE';
  }

  const normalizedCode = (input.providerCode || '').toLowerCase();
  if (normalizedCode.includes('insufficient') || normalizedCode.includes('declined')) {
    return 'BANK_DECLINE';
  }

  return 'PROCESSOR_RETRYABLE';
}

/**
 * Placeholder sink for future outbound notifications (email/SMS/etc.).
 *
 * Current behavior: return a deterministic token only. A future phase will
 * persist the event and dispatch with a provider like Resend/Postmark.
 */
export async function queuePaymentCommunicationEvent(
  event: PaymentCommunicationEvent
): Promise<{ queued: true; reference: string }> {
  const reference = [event.type, event.userId, event.triggeredAt.getTime()].join(':');

  return {
    queued: true,
    reference,
  };
}

'use server';

import { prisma } from '@/lib/prisma';
import { verifyAdminOrModerator } from '@/lib/admin/access';
import { ADMIN_CAPABILITIES } from '@/lib/admin/capabilities';
import {
  PAYMENT_COMMUNICATION_EVENT_TYPES,
  PAYMENT_COMMUNICATION_STATUS_TYPES,
  type PaymentEventType,
  type PaymentLogStatus,
} from '@/lib/payments/communication-options';

export interface PaymentCommunicationInput {
  memberEmail: string;
  eventType: PaymentEventType;
  reason?: string;
  status?: PaymentLogStatus;
  note?: string;
}

export interface PaymentCommunicationLog {
  id: string;
  actorEmail: string;
  actorRole: 'SUPERADMIN' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
  memberId: string;
  memberEmail: string;
  eventType: PaymentEventType;
  reason: string;
  status: PaymentLogStatus;
  note: string | null;
  createdAt: string;
}

export async function getPaymentCommunicationLogs(
  limit = 50
): Promise<{ success: true; data: PaymentCommunicationLog[] } | { success: false; error: string }> {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.INSPECT_SUBSCRIPTIONS);

  if (!access.authorized || !access.userId) {
    return { success: false, error: 'Not authorized to view payment communication logs' };
  }

  const safeLimit = Math.min(Math.max(limit, 1), 100);

  try {
    const logs = await prisma.paymentCommunicationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
      select: {
        id: true,
        memberId: true,
        actor: {
          select: {
            email: true,
            role: true,
          },
        },
        member: {
          select: {
            email: true,
          },
        },
        eventType: true,
        reason: true,
        status: true,
        note: true,
        createdAt: true,
      },
    });

    const normalized: PaymentCommunicationLog[] = logs.map((log) => {
      const eventType =
        PAYMENT_COMMUNICATION_EVENT_TYPES.includes(log.eventType as PaymentEventType)
          ? (log.eventType as PaymentEventType)
          : 'ADMIN_OUTREACH';
      const status =
        PAYMENT_COMMUNICATION_STATUS_TYPES.includes(log.status as PaymentLogStatus)
          ? (log.status as PaymentLogStatus)
          : 'PENDING_FOLLOW_UP';

      return {
        id: log.id,
        actorEmail: log.actor.email,
        actorRole: log.actor.role as PaymentCommunicationLog['actorRole'],
        memberId: log.memberId,
        memberEmail: log.member.email,
        eventType,
        reason: log.reason,
        status,
        note: log.note,
        createdAt: log.createdAt.toISOString(),
      };
    });

    return { success: true, data: normalized };
  } catch (error) {
    console.error('Failed to load payment communication logs:', error);
    return { success: false, error: 'Failed to load payment communication logs' };
  }
}

export async function createPaymentCommunicationLog(
  input: PaymentCommunicationInput
): Promise<{ success: true; message: string } | { success: false; error: string }> {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.INSPECT_SUBSCRIPTIONS);

  if (!access.authorized || !access.userId) {
    return { success: false, error: 'Not authorized to create payment communication logs' };
  }

  const memberEmail = input.memberEmail.trim().toLowerCase();
  const eventType = input.eventType;
  const status = input.status ?? 'PENDING_FOLLOW_UP';
  const reason = input.reason?.trim();
  const note = input.note?.trim();

  if (!memberEmail || !memberEmail.includes('@')) {
    return { success: false, error: 'Enter a valid member email' };
  }

  if (!PAYMENT_COMMUNICATION_EVENT_TYPES.includes(eventType)) {
    return { success: false, error: 'Invalid event type' };
  }

  if (!PAYMENT_COMMUNICATION_STATUS_TYPES.includes(status)) {
    return { success: false, error: 'Invalid status' };
  }

  try {
    const member = await prisma.user.findUnique({
      where: { email: memberEmail },
      select: { id: true, email: true },
    });

    if (!member) {
      return { success: false, error: 'Member not found for the provided email' };
    }

    await prisma.paymentCommunicationLog.create({
      data: {
        actorId: access.userId,
        memberId: member.id,
        eventType,
        reason: reason || 'N/A',
        status,
        note: note || null,
      },
    });

    return { success: true, message: 'Payment communication log saved' };
  } catch (error) {
    console.error('Failed to save payment communication log:', error);
    return { success: false, error: 'Failed to save payment communication log' };
  }
}

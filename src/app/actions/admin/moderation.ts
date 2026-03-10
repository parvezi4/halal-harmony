'use server';

import { prisma } from '@/lib/prisma';
import { filterContent } from '@/lib/moderation/contentFilter';
import { verifyAdminOrModerator } from '@/lib/admin/access';
import { ADMIN_CAPABILITIES } from '@/lib/admin/capabilities';

/**
 * Get all pending messages for admin review
 */
export async function getPendingMessages() {
  const { authorized } = await verifyAdminOrModerator(ADMIN_CAPABILITIES.MODERATE_MESSAGES);

  if (!authorized) {
    return {
      success: false,
      errors: { general: 'Not authorized' },
    };
  }

  try {
    const pendingMessages = await prisma.message.findMany({
      where: {
        moderationStatus: 'PENDING',
      },
      orderBy: { createdAt: 'asc' }, // FIFO - oldest first
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                alias: true,
                fullName: true,
              },
            },
          },
        },
        thread: {
          include: {
            participantA: {
              select: {
                id: true,
                profile: {
                  select: {
                    alias: true,
                    fullName: true,
                  },
                },
              },
            },
            participantB: {
              select: {
                id: true,
                profile: {
                  select: {
                    alias: true,
                    fullName: true,
                  },
                },
              },
            },
            messages: {
              where: {
                moderationStatus: 'APPROVED',
              },
              orderBy: { createdAt: 'desc' },
              take: 5, // Last 5 approved messages for context
              include: {
                sender: {
                  select: {
                    id: true,
                    profile: {
                      select: {
                        alias: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const formatted = pendingMessages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      isFlagged: msg.isFlagged,
      flaggedReason: msg.flaggedReason,
      sender: {
        id: msg.sender.id,
        email: msg.sender.email,
        alias: msg.sender.profile?.alias || 'Unknown',
        fullName: msg.sender.profile?.fullName,
      },
      thread: {
        id: msg.thread.id,
        participants: [
          {
            id: msg.thread.participantA.id,
            alias: msg.thread.participantA.profile?.alias || 'Unknown',
          },
          {
            id: msg.thread.participantB.id,
            alias: msg.thread.participantB.profile?.alias || 'Unknown',
          },
        ],
        recentMessages: msg.thread.messages.map((m) => ({
          content: m.content.substring(0, 100),
          createdAt: m.createdAt.toISOString(),
          senderAlias: m.sender.profile?.alias || 'Unknown',
        })),
      },
    }));

    return {
      success: true,
      data: formatted,
    };
  } catch (error) {
    console.error('Error fetching pending messages:', error);
    return {
      success: false,
      errors: { general: 'Failed to fetch pending messages' },
    };
  }
}

/**
 * Approve a flagged message
 * Releases the message and re-evaluates queued messages in the thread
 */
export async function approveMessage(messageId: string) {
  const { authorized } = await verifyAdminOrModerator(ADMIN_CAPABILITIES.MODERATE_MESSAGES);

  if (!authorized) {
    return {
      success: false,
      errors: { general: 'Not authorized' },
    };
  }

  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: {
        threadId: true,
        moderationStatus: true,
        createdAt: true,
      },
    });

    if (!message) {
      return {
        success: false,
        errors: { general: 'Message not found' },
      };
    }

    if (message.moderationStatus !== 'PENDING') {
      return {
        success: false,
        errors: { general: 'Message is not pending review' },
      };
    }

    // Approve the message
    await prisma.message.update({
      where: { id: messageId },
      data: {
        moderationStatus: 'APPROVED',
      },
    });

    // Update thread lastMessageAt
    await prisma.messageThread.update({
      where: { id: message.threadId },
      data: { lastMessageAt: message.createdAt },
    });

    // Check for queued messages in the same thread (created after this message)
    const queuedMessages = await prisma.message.findMany({
      where: {
        threadId: message.threadId,
        moderationStatus: 'PENDING',
        createdAt: { gt: message.createdAt },
        flaggedReason: 'Queued - waiting for previous message approval',
      },
      orderBy: { createdAt: 'asc' },
    });

    // Re-evaluate each queued message
    for (const queuedMsg of queuedMessages) {
      const moderationResult = filterContent(queuedMsg.content);

      if (moderationResult.isSafe) {
        // Message is clean, approve it
        await prisma.message.update({
          where: { id: queuedMsg.id },
          data: {
            moderationStatus: 'APPROVED',
            flaggedReason: null,
            isFlagged: false,
          },
        });

        // Update thread timestamp
        await prisma.messageThread.update({
          where: { id: message.threadId },
          data: { lastMessageAt: queuedMsg.createdAt },
        });
      } else {
        // Message has violations, keep as pending with new reason
        await prisma.message.update({
          where: { id: queuedMsg.id },
          data: {
            flaggedReason: moderationResult.flaggedReason,
            isFlagged: true,
          },
        });
        // Stop processing further queued messages
        break;
      }
    }

    return {
      success: true,
      data: { messageId, releasedCount: queuedMessages.length },
    };
  } catch (error) {
    console.error('Error approving message:', error);
    return {
      success: false,
      errors: { general: 'Failed to approve message' },
    };
  }
}

/**
 * Reject a message and optionally send warning to sender
 */
export async function rejectMessage(messageId: string, warningMessage?: string) {
  const { authorized } = await verifyAdminOrModerator(ADMIN_CAPABILITIES.MODERATE_MESSAGES);

  if (!authorized) {
    return {
      success: false,
      errors: { general: 'Not authorized' },
    };
  }

  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: {
        threadId: true,
        senderId: true,
        moderationStatus: true,
        createdAt: true,
      },
    });

    if (!message) {
      return {
        success: false,
        errors: { general: 'Message not found' },
      };
    }

    if (message.moderationStatus !== 'PENDING') {
      return {
        success: false,
        errors: { general: 'Message is not pending review' },
      };
    }

    // Reject the message
    await prisma.message.update({
      where: { id: messageId },
      data: {
        moderationStatus: 'REJECTED',
      },
    });

    // TODO: Implement warning notification system
    // For now, just log the warning
    if (warningMessage) {
      console.log(`Warning sent to user ${message.senderId}: ${warningMessage}`);
      // Future: Create a Notification model and send warning
    }

    // Release other queued messages (that aren't flagged for violations)
    const queuedMessages = await prisma.message.findMany({
      where: {
        threadId: message.threadId,
        moderationStatus: 'PENDING',
        createdAt: { gt: message.createdAt },
        flaggedReason: 'Queued - waiting for previous message approval',
      },
      orderBy: { createdAt: 'asc' },
    });

    let releasedCount = 0;
    for (const queuedMsg of queuedMessages) {
      const moderationResult = filterContent(queuedMsg.content);

      if (moderationResult.isSafe) {
        await prisma.message.update({
          where: { id: queuedMsg.id },
          data: {
            moderationStatus: 'APPROVED',
            flaggedReason: null,
            isFlagged: false,
          },
        });

        await prisma.messageThread.update({
          where: { id: message.threadId },
          data: { lastMessageAt: queuedMsg.createdAt },
        });

        releasedCount++;
      } else {
        // Keep flagged
        await prisma.message.update({
          where: { id: queuedMsg.id },
          data: {
            flaggedReason: moderationResult.flaggedReason,
            isFlagged: true,
          },
        });
        break; // Stop at first violating message
      }
    }

    return {
      success: true,
      data: { messageId, releasedCount },
    };
  } catch (error) {
    console.error('Error rejecting message:', error);
    return {
      success: false,
      errors: { general: 'Failed to reject message' },
    };
  }
}

/**
 * Get moderation statistics for admin dashboard
 */
export async function getModerationStats() {
  const { authorized } = await verifyAdminOrModerator(ADMIN_CAPABILITIES.MODERATE_MESSAGES);

  if (!authorized) {
    return {
      success: false,
      errors: { general: 'Not authorized' },
    };
  }

  try {
    const [pendingCount, approvedCount, rejectedCount, flaggedCount] = await Promise.all([
      prisma.message.count({ where: { moderationStatus: 'PENDING' } }),
      prisma.message.count({ where: { moderationStatus: 'APPROVED' } }),
      prisma.message.count({ where: { moderationStatus: 'REJECTED' } }),
      prisma.message.count({ where: { isFlagged: true } }),
    ]);

    return {
      success: true,
      data: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        totalFlagged: flaggedCount,
      },
    };
  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    return {
      success: false,
      errors: { general: 'Failed to fetch stats' },
    };
  }
}

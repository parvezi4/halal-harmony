'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import { checkEitherHasSubscription } from '@/lib/subscription/checkActiveSubscription';
import { filterContent, shouldHoldForApproval } from '@/lib/moderation/contentFilter';

/**
 * Get all message threads for the current user
 * Returns threads sorted by lastMessageAt (most recent first)
 */
export async function getThreads() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      success: false,
      errors: { general: 'Not authenticated' },
    };
  }

  try {
    // Get threads where user is either participantA or participantB
    const threads = await prisma.messageThread.findMany({
      where: {
        OR: [{ participantAId: session.user.id }, { participantBId: session.user.id }],
        isBlocked: false,
      },
      include: {
        participantA: {
          include: {
            profile: {
              select: {
                alias: true,
                fullName: true,
                photos: {
                  where: { isPrimary: true },
                  select: { url: true, isBlurred: true },
                  take: 1,
                },
              },
            },
          },
        },
        participantB: {
          include: {
            profile: {
              select: {
                alias: true,
                fullName: true,
                photos: {
                  where: { isPrimary: true },
                  select: { url: true, isBlurred: true },
                  take: 1,
                },
              },
            },
          },
        },
        messages: {
          where: {
            moderationStatus: 'APPROVED', // Only show approved messages in preview
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            senderId: true,
            isRead: true,
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: session.user.id },
                isRead: false,
                moderationStatus: 'APPROVED',
              },
            },
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    // Format threads for frontend
    const formattedThreads = threads.map((thread) => {
      const otherParticipant =
        thread.participantAId === session.user.id ? thread.participantB : thread.participantA;

      const lastMessage = thread.messages[0];

      return {
        id: thread.id,
        otherParticipant: {
          id: otherParticipant.id,
          alias: otherParticipant.profile?.alias || 'Unknown',
          fullName: otherParticipant.profile?.fullName,
          photo: otherParticipant.profile?.photos[0],
        },
        lastMessage: lastMessage
          ? {
              content: lastMessage.content.substring(0, 100), // Truncate for preview
              createdAt: lastMessage.createdAt.toISOString(),
              isFromMe: lastMessage.senderId === session.user.id,
            }
          : null,
        unreadCount: thread._count.messages,
        lastMessageAt: thread.lastMessageAt.toISOString(),
      };
    });

    return {
      success: true,
      data: formattedThreads,
    };
  } catch (error) {
    console.error('Error fetching threads:', error);
    return {
      success: false,
      errors: { general: 'Failed to fetch conversations' },
    };
  }
}

/**
 * Get paginated messages for a specific thread
 * - Initial load: latest `limit` messages
 * - Older load: pass `before` cursor and get previous `limit` messages
 */
export async function getThreadMessages(
  threadId: string,
  options?: { before?: string; limit?: number }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      success: false,
      errors: { general: 'Not authenticated' },
    };
  }

  try {
    // Verify user is a participant in this thread
    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
      select: {
        participantAId: true,
        participantBId: true,
        isBlocked: true,
      },
    });

    if (!thread) {
      return {
        success: false,
        errors: { general: 'Thread not found' },
      };
    }

    if (thread.participantAId !== session.user.id && thread.participantBId !== session.user.id) {
      return {
        success: false,
        errors: { general: 'Not authorized to view this thread' },
      };
    }

    if (thread.isBlocked) {
      return {
        success: false,
        errors: { general: 'This conversation has been blocked' },
      };
    }

    const requestedLimit = options?.limit ?? 10;
    const safeLimit = Math.min(Math.max(requestedLimit, 1), 50);
    const parsedBeforeDate = options?.before ? new Date(options.before) : null;
    const beforeDate =
      parsedBeforeDate && !Number.isNaN(parsedBeforeDate.getTime()) ? parsedBeforeDate : null;

    // Query newest-first for cursor pagination and pull one extra to compute hasMore.
    // Use stable sort by createdAt + id to ensure consistent ordering even with identical timestamps
    const rawMessages = await prisma.message.findMany({
      where: {
        threadId,
        OR: [
          { moderationStatus: 'APPROVED' },
          { senderId: session.user.id }, // User sees their own messages
        ],
        ...(beforeDate ? { createdAt: { lt: beforeDate } } : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: safeLimit + 1,
      include: {
        sender: {
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
      },
    });

    const hasMore = rawMessages.length > safeLimit;
    const pageMessages = hasMore ? rawMessages.slice(0, safeLimit) : rawMessages;
    const messages = pageMessages.reverse();

    //Mark messages as read
    await prisma.message.updateMany({
      where: {
        threadId,
        senderId: { not: session.user.id },
        isRead: false,
        moderationStatus: 'APPROVED',
      },
      data: {
        isRead: true,
      },
    });

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      isFromMe: msg.senderId === session.user.id,
      isRead: msg.isRead,
      senderAlias: msg.sender.profile?.alias || 'Unknown',
      moderationStatus: msg.moderationStatus,
      isFlagged: msg.isFlagged,
      flaggedReason: msg.flaggedReason,
    }));

    return {
      success: true,
      data: {
        messages: formattedMessages,
        threadId,
        hasMore,
      },
    };
  } catch (error) {
    console.error('Error fetching thread messages:', error);
    return {
      success: false,
      errors: { general: 'Failed to fetch messages' },
    };
  }
}

/**
 * Send a message in a thread
 */
export async function sendMessage(threadId: string, content: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      success: false,
      errors: { general: 'Not authenticated' },
    };
  }

  // Validate content
  if (!content || content.trim().length === 0) {
    return {
      success: false,
      errors: { content: 'Message cannot be empty' },
    };
  }

  if (content.length > 2000) {
    return {
      success: false,
      errors: { content: 'Message too long (max 2000 characters)' },
    };
  }

  try {
    // Verify user is a participant
    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
      select: {
        participantAId: true,
        participantBId: true,
        isBlocked: true,
        messages: {
          where: {
            moderationStatus: 'PENDING',
          },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!thread) {
      return {
        success: false,
        errors: { general: 'Thread not found' },
      };
    }

    if (thread.participantAId !== session.user.id && thread.participantBId !== session.user.id) {
      return {
        success: false,
        errors: { general: 'Not authorized to send messages in this thread' },
      };
    }

    if (thread.isBlocked) {
      return {
        success: false,
        errors: { general: 'This conversation has been blocked' },
      };
    }

    // Check for pending messages in thread
    const hasPendingMessages = thread.messages.length > 0;

    // Moderate content
    const moderationResult = filterContent(content);
    const holdForApproval = shouldHoldForApproval();

    let moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    let isFlagged = false;
    let flaggedReason: string | undefined;

    if (!moderationResult.isSafe) {
      // Content is flagged
      isFlagged = true;
      flaggedReason = moderationResult.flaggedReason;
      moderationStatus = 'PENDING';
    } else if (hasPendingMessages && holdForApproval) {
      // Content is clean but thread has pending messages - queue to preserve order
      moderationStatus = 'PENDING';
      flaggedReason = 'Queued - waiting for previous message approval';
    } else {
      // Content is clean and no pending messages
      moderationStatus = 'APPROVED';
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        threadId,
        senderId: session.user.id,
        content: content.trim(),
        isFlagged,
        flaggedReason,
        moderationStatus,
      },
      include: {
        sender: {
          select: {
            profile: {
              select: {
                alias: true,
              },
            },
          },
        },
      },
    });

    // Update thread lastMessageAt only if message is approved
    if (moderationStatus === 'APPROVED') {
      await prisma.messageThread.update({
        where: { id: threadId },
        data: { lastMessageAt: new Date() },
      });
    }

    return {
      success: true,
      data: {
        message: {
          id: message.id,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          isFromMe: true,
          isRead: message.isRead,
          senderAlias: message.sender.profile?.alias || 'You',
          moderationStatus: message.moderationStatus,
          isFlagged: message.isFlagged,
          flaggedReason: message.flaggedReason,
        },
      },
    };
  } catch (error) {
    console.error('Error sending message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown messaging error';

    return {
      success: false,
      errors: {
        general:
          process.env.NODE_ENV === 'development'
            ? `Failed to send message: ${errorMessage}`
            : 'Failed to send message',
      },
    };
  }
}

/**
 * Initiate a new conversation thread with another user
 */
export async function initiateThread(recipientId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      success: false,
      errors: { general: 'Not authenticated' },
    };
  }

  if (recipientId === session.user.id) {
    return {
      success: false,
      errors: { general: 'Cannot start conversation with yourself' },
    };
  }

  try {
    // Check if at least one party has subscription
    const hasSubscription = await checkEitherHasSubscription(session.user.id, recipientId);

    if (!hasSubscription) {
      return {
        success: false,
        errors: {
          subscription: 'At least one person must have a subscription to start a conversation',
        },
      };
    }

    // Check if thread already exists (bidirectional)
    const existingThread = await prisma.messageThread.findFirst({
      where: {
        OR: [
          {
            participantAId: session.user.id,
            participantBId: recipientId,
          },
          {
            participantAId: recipientId,
            participantBId: session.user.id,
          },
        ],
      },
    });

    if (existingThread) {
      return {
        success: true,
        data: {
          threadId: existingThread.id,
          existed: true,
        },
      };
    }

    // Verify recipient exists and has approved profile
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      include: {
        profile: {
          select: {
            status: true,
            gender: true,
          },
        },
      },
    });

    if (!recipient || !recipient.profile) {
      return {
        success: false,
        errors: { general: 'Recipient not found' },
      };
    }

    if (recipient.profile.status !== 'APPROVED') {
      return {
        success: false,
        errors: { general: 'Cannot message this user' },
      };
    }

    // Verify opposite gender (halal requirement)
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { gender: true },
    });

    if (currentUserProfile?.gender && currentUserProfile.gender === recipient.profile.gender) {
      return {
        success: false,
        errors: {
          general: 'Can only message members of the opposite gender',
        },
      };
    }

    // Create new thread
    const newThread = await prisma.messageThread.create({
      data: {
        participantAId: session.user.id,
        participantBId: recipientId,
      },
    });

    return {
      success: true,
      data: {
        threadId: newThread.id,
        existed: false,
      },
    };
  } catch (error) {
    console.error('Error initiating thread:', error);
    return {
      success: false,
      errors: { general: 'Failed to start conversation' },
    };
  }
}

/**
 * Get unread message count for current user
 */
export async function getUnreadCount() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      success: false,
      errors: { general: 'Not authenticated' },
    };
  }

  try {
    // Get threads where user is a participant
    const threads = await prisma.messageThread.findMany({
      where: {
        OR: [{ participantAId: session.user.id }, { participantBId: session.user.id }],
        isBlocked: false,
      },
      select: { id: true },
    });

    const threadIds = threads.map((t) => t.id);

    // Count unread messages
    const unreadCount = await prisma.message.count({
      where: {
        threadId: { in: threadIds },
        senderId: { not: session.user.id },
        isRead: false,
        moderationStatus: 'APPROVED',
      },
    });

    return {
      success: true,
      data: { count: unreadCount },
    };
  } catch (error) {
    console.error('Error getting unread count:', error);
    return {
      success: false,
      errors: { general: 'Failed to get unread count' },
    };
  }
}

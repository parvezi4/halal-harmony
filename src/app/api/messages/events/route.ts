import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * SSE endpoint for real-time message updates
 * GET /api/messages/events
 */
export async function GET(request: NextRequest) {
  // Verify authentication
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;

  // Set up SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Helper to send SSE message
      const sendEvent = (data: unknown, event?: string) => {
        const message = `${event ? `event: ${event}\n` : ''}data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Send initial connection confirmation
      sendEvent({ type: 'connected', message: 'SSE connection established' });

      // Get user's threads
      const getUserThreads = async () => {
        return await prisma.messageThread.findMany({
          where: {
            OR: [{ participantAId: userId }, { participantBId: userId }],
            isBlocked: false,
          },
          select: { id: true },
        });
      };

      // Track last checked timestamp
      let lastChecked = new Date();

      // Polling interval (5 seconds)
      const pollInterval = 5000;

      const poll = async () => {
        try {
          const threads = await getUserThreads();
          const threadIds = threads.map((t) => t.id);

          if (threadIds.length === 0) {
            return; // No threads, nothing to check
          }

          // Check for new messages since last check
          const newMessages = await prisma.message.findMany({
            where: {
              threadId: { in: threadIds },
              senderId: { not: userId }, // Only messages from others
              createdAt: { gt: lastChecked },
              moderationStatus: 'APPROVED',
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
              thread: {
                select: {
                  id: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          });

          // Send new message events
          for (const msg of newMessages) {
            sendEvent(
              {
                threadId: msg.threadId,
                id: msg.id,
                content: msg.content,
                createdAt: msg.createdAt.toISOString(),
                senderAlias: msg.sender.profile?.alias || 'Unknown',
              },
              'message'
            );
          }

          // Get updated unread count
          const unreadCount = await prisma.message.count({
            where: {
              threadId: { in: threadIds },
              senderId: { not: userId },
              isRead: false,
              moderationStatus: 'APPROVED',
            },
          });

          // Send unread count update (even if 0)
          sendEvent(
            {
              count: unreadCount,
            },
            'unread'
          );

          lastChecked = new Date();
        } catch (error) {
          console.error('SSE polling error:', error);
          // Don't close connection on error, just skip this interval
        }
      };

      // Start polling
      const intervalId = setInterval(poll, pollInterval) as unknown as number; // eslint-disable-line no-undef

      // Initial poll
      await poll();

      // Clean up on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId); // eslint-disable-line no-undef
        controller.close();
      });
    },
  });

  return new Response(stream, { headers });
}

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { getThreads } from '@/app/actions/messages';
import { MessagesPageClient } from './MessagesPageClient';

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  const result = await getThreads();

  const threads =
    result.success && result.data
      ? result.data.map((thread) => ({
          threadId: thread.id,
          otherParticipant: {
            id: thread.otherParticipant.id,
            alias: thread.otherParticipant.alias,
          },
          lastMessage: thread.lastMessage
            ? {
                preview: thread.lastMessage.content,
                createdAt: thread.lastMessage.createdAt,
              }
            : null,
          unreadCount: thread.unreadCount,
        }))
      : [];

  const userGender =
    session?.user && 'gender' in session.user ? (session.user.gender as string) : undefined;

  return <MessagesPageClient initialThreads={threads} userGender={userGender} />;
}

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatView } from './ChatView';
import { NewConversationModal } from './NewConversationModal';
import { useMessageSSE } from './useMessageSSE';

interface Thread {
  threadId: string;
  otherParticipant: {
    id: string;
    alias: string;
  };
  lastMessage: {
    preview: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

interface MessagesPageClientProps {
  initialThreads: Thread[];
  userGender?: string;
}

export function MessagesPageClient({ initialThreads, userGender }: MessagesPageClientProps) {
  const searchParams = useSearchParams();
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [selectedThread, setSelectedThread] = useState<{
    threadId: string;
    alias: string;
  } | null>(null);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Auto-select thread from query param if provided
  useEffect(() => {
    const threadId = searchParams.get('threadId');
    if (threadId) {
      const thread = initialThreads.find((t) => t.threadId === threadId);
      if (thread) {
        setSelectedThread({
          threadId: thread.threadId,
          alias: thread.otherParticipant.alias,
        });
        // Clear the query param so it doesn't persist
        window.history.replaceState({}, '', '/messages');
      }
    }
  }, [searchParams, initialThreads]);

  const filteredThreads = filter === 'unread' ? threads.filter((t) => t.unreadCount > 0) : threads;

  useMessageSSE({
    onMessage: (incoming) => {
      setThreads((prev) => {
        const existingIndex = prev.findIndex((t) => t.threadId === incoming.threadId);

        if (existingIndex === -1) {
          return prev;
        }

        const updated = [...prev];
        const existing = updated[existingIndex];
        const isActiveThread = selectedThread?.threadId === incoming.threadId;

        updated[existingIndex] = {
          ...existing,
          lastMessage: {
            preview: incoming.content.slice(0, 100),
            createdAt: incoming.createdAt,
          },
          unreadCount: isActiveThread ? 0 : existing.unreadCount + 1,
        };

        const [moved] = updated.splice(existingIndex, 1);
        updated.unshift(moved);
        return updated;
      });
    },
    onUnreadCountUpdate: (count) => {
      // Keep inbox totals aligned with header by reconciling thread unread counts.
      setThreads((prev) => {
        const computed = prev.reduce((sum, thread) => sum + thread.unreadCount, 0);
        if (computed === count) {
          return prev;
        }

        if (!selectedThread) {
          return prev;
        }

        return prev.map((thread) =>
          thread.threadId === selectedThread.threadId ? { ...thread, unreadCount: 0 } : thread
        );
      });
    },
    enabled: true,
  });

  // Guard against duplicate thread entries when an existing conversation is re-opened.
  const uniqueThreads = filteredThreads.filter(
    (thread, index, arr) => arr.findIndex((t) => t.threadId === thread.threadId) === index
  );

  const handleThreadCreated = (threadId: string, recipientId: string) => {
    // Add new thread to list
    const newThread: Thread = {
      threadId,
      otherParticipant: {
        id: recipientId,
        alias: 'User', // Placeholder - will be replaced when messages load
      },
      lastMessage: null,
      unreadCount: 0,
    };

    // If thread already exists, do not duplicate it; just focus it.
    setThreads((prev) => {
      if (prev.some((thread) => thread.threadId === threadId)) {
        return prev;
      }
      return [newThread, ...prev];
    });

    setSelectedThread({ threadId, alias: 'User' });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">Messages</h1>
        <p className="mt-1 text-xs text-slate-400 sm:text-sm">
          Only subscribers can start new conversations. Keep all communication halal and respectful.
        </p>
        {userGender === 'FEMALE' && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-[11px] text-amber-100">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
            <span>Remember to involve your wali/guardians early where appropriate.</span>
          </div>
        )}
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,3fr)]">
        {/* Conversation list */}
        <aside className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <header className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-50">Inbox</h2>
            <div className="flex gap-1 rounded-full border border-slate-700 bg-slate-950 p-1 text-[11px] text-slate-200">
              <button
                onClick={() => setFilter('all')}
                className={`rounded-full px-2 py-0.5 ${
                  filter === 'all' ? 'bg-slate-800' : 'hover:bg-slate-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`rounded-full px-2 py-0.5 ${
                  filter === 'unread' ? 'bg-slate-800' : 'hover:bg-slate-800'
                }`}
              >
                Unread
              </button>
            </div>
          </header>

          <button
            onClick={() => setShowNewConversation(true)}
            className="w-full rounded-xl border border-accent-500/40 bg-accent-500/10 px-3 py-2 text-xs font-semibold text-accent-200 hover:border-accent-500"
          >
            + New Conversation
          </button>

          <div className="space-y-2">
            {filteredThreads.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                {filter === 'unread' ? 'No unread messages' : 'No conversations yet'}
              </p>
            ) : (
              uniqueThreads.map((thread, index) => (
                <button
                  key={`${thread.threadId || 'thread'}-${index}`}
                  onClick={() => {
                    setSelectedThread({
                      threadId: thread.threadId,
                      alias: thread.otherParticipant.alias,
                    });

                    setThreads((prev) =>
                      prev.map((item) =>
                        item.threadId === thread.threadId ? { ...item, unreadCount: 0 } : item
                      )
                    );
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                    selectedThread?.threadId === thread.threadId
                      ? 'border-accent-500/40 bg-accent-500/10 text-accent-200'
                      : 'border-slate-800 bg-slate-950/60 text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] text-slate-400">
                    {thread.otherParticipant.alias.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-50">{thread.otherParticipant.alias}</p>
                      {thread.lastMessage && (
                        <span className="text-[10px] text-slate-400">
                          {formatTimeAgo(thread.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {thread.lastMessage && (
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-300">
                        {thread.lastMessage.preview}
                      </p>
                    )}
                  </div>
                  {thread.unreadCount > 0 && (
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent-400 text-[10px] font-bold text-slate-950">
                      {thread.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Chat view or placeholder */}
        {selectedThread ? (
          <ChatView
            threadId={selectedThread.threadId}
            otherUserAlias={selectedThread.alias}
            userGender={userGender}
            onMessageSent={({ threadId, content, createdAt }) => {
              setThreads((prev) => {
                const existingIndex = prev.findIndex((t) => t.threadId === threadId);
                if (existingIndex === -1) {
                  return prev;
                }

                const updated = [...prev];
                const existing = updated[existingIndex];
                updated[existingIndex] = {
                  ...existing,
                  lastMessage: {
                    preview: content.slice(0, 100),
                    createdAt,
                  },
                };

                const [moved] = updated.splice(existingIndex, 1);
                updated.unshift(moved);
                return updated;
              });
            }}
            onClose={() => setSelectedThread(null)}
          />
        ) : (
          <section className="flex min-h-[500px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/70">
            <div className="text-center">
              <p className="text-sm text-slate-400">Select a conversation to view messages</p>
              <p className="mt-2 text-xs text-slate-500">
                or start a new conversation with the button above
              </p>
            </div>
          </section>
        )}
      </section>

      {/* New conversation modal */}
      {showNewConversation && (
        <NewConversationModal
          onClose={() => setShowNewConversation(false)}
          onThreadCreated={handleThreadCreated}
        />
      )}
    </div>
  );
}

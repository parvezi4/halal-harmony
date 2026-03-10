'use client';

import { useState, useEffect, useCallback, useMemo, FormEvent, useRef } from 'react';
import { sendMessage, getThreadMessages } from '@/app/actions/messages';
import { useMessageSSE, type MessageEvent } from './useMessageSSE';

interface ChatViewProps {
  threadId: string;
  otherUserAlias: string;
  userGender?: string;
  onClose?: () => void;
  onMessageSent?: (_payload: { threadId: string; content: string; createdAt: string }) => void; // eslint-disable-line no-unused-vars
}

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  isFromMe: boolean;
  isRead?: boolean;
  senderAlias: string;
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  isFlagged?: boolean;
  flaggedReason?: string | null;
}

/**
 * Chat view component for one-on-one messaging
 * Features:
 * - Real-time message updates via SSE
 * - Message status indicators (sent, under review, rejected)
 * - 2000 character limit
 * - Auto-scroll to newest messages
 */
export function ChatView({
  threadId,
  otherUserAlias,
  userGender,
  onClose,
  onMessageSent,
}: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldAutoScrollRef = useRef(true);

  const dedupeMessages = useCallback((items: ChatMessage[]) => {
    const unique = new Map<string, ChatMessage>();
    for (const item of items) {
      unique.set(item.id, item);
    }
    return Array.from(unique.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, []);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    const result = await getThreadMessages(threadId, { limit: 10 });
    if (result.success && result.data) {
      setMessages(dedupeMessages(result.data.messages));
      setHasMoreMessages(Boolean(result.data.hasMore));
      shouldAutoScrollRef.current = true;
    }
    setIsLoading(false);
  }, [threadId, dedupeMessages]);

  const loadOlderMessages = useCallback(async () => {
    if (isLoadingOlder || !hasMoreMessages || messages.length === 0) {
      return;
    }

    const oldestMessage = messages[0];
    const container = messagesContainerRef.current;
    const previousScrollHeight = container?.scrollHeight ?? 0;
    const previousScrollTop = container?.scrollTop ?? 0;

    setIsLoadingOlder(true);
    const result = await getThreadMessages(threadId, { before: oldestMessage.createdAt, limit: 5 });

    if (result.success && result.data) {
      shouldAutoScrollRef.current = false;
      setHasMoreMessages(Boolean(result.data.hasMore));
      setMessages((prev) => dedupeMessages([...result.data.messages, ...prev]));

      // Preserve viewport when prepending older messages.
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
          const current = messagesContainerRef.current;
          if (!current) return;
          const newScrollHeight = current.scrollHeight;
          current.scrollTop = previousScrollTop + (newScrollHeight - previousScrollHeight);
        });
      }
    }

    setIsLoadingOlder(false);
  }, [dedupeMessages, hasMoreMessages, isLoadingOlder, messages, threadId]);

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (!shouldAutoScrollRef.current) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Focus input field after initial load or new messages
    textareaRef.current?.focus();
  }, [messages]);

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container || isLoading || isLoadingOlder || !hasMoreMessages) {
      return;
    }

    if (container.scrollTop <= 20) {
      void loadOlderMessages();
    }
  };

  // Listen for new messages via SSE (real-time updates without polling)
  useMessageSSE({
    onMessage: (newMessage: MessageEvent) => {
      if (newMessage.threadId !== threadId) {
        return;
      }

      setMessages((prev) => {
        const incoming: ChatMessage = {
          id: newMessage.id,
          content: newMessage.content,
          createdAt: newMessage.createdAt,
          isFromMe: false,
          isRead: false,
          senderAlias: newMessage.senderAlias,
          moderationStatus: 'APPROVED',
        };
        shouldAutoScrollRef.current = true;
        return dedupeMessages([...prev, incoming]);
      });
    },
    enabled: true,
  });

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    const result = await sendMessage(threadId, messageInput);

    if (result.success && result.data) {
      // Add message optimistically to UI
      const newMessage: ChatMessage = {
        id: result.data.message.id,
        content: result.data.message.content,
        createdAt: result.data.message.createdAt,
        isFromMe: true,
        isRead: result.data.message.isRead,
        senderAlias: result.data.message.senderAlias,
        moderationStatus: result.data.message.moderationStatus,
        isFlagged: result.data.message.isFlagged,
        flaggedReason: result.data.message.flaggedReason,
      };
      shouldAutoScrollRef.current = true;
      setMessages((prev) => dedupeMessages([...prev, newMessage]));
      onMessageSent?.({
        threadId,
        content: newMessage.content,
        createdAt: newMessage.createdAt,
      });
      setMessageInput('');
    } else {
      setError(result.errors?.general || result.errors?.content || 'Failed to send message');
    }

    setIsSending(false);
  };

  const getModerationStatusLabel = (msg: ChatMessage) => {
    if (msg.moderationStatus === 'PENDING') {
      if (msg.flaggedReason?.includes('Queued')) {
        return '⏳ Queued';
      }
      return '⏳ Under Review';
    }
    if (msg.moderationStatus === 'REJECTED') {
      return '❌ Rejected';
    }

    if (msg.isFromMe) {
      return msg.isRead ? '✓ Read' : '✓ Sent';
    }

    return '✓ Delivered';
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Today: show time only
    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    // Yesterday
    if (messageDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    }

    // Within 7 days: show day name
    const daysDiff = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }

    // Older: show date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const characterCount = messageInput.length;
  const characterLimit = 2000;
  const uniqueMessages = useMemo(() => dedupeMessages(messages), [messages, dedupeMessages]);

  return (
    <section className="flex h-[600px] flex-col rounded-2xl border border-slate-800 bg-slate-900/70">
      {/* Header */}
      <header className="flex items-center justify-between gap-2 border-b border-slate-800 px-4 py-3 text-xs text-slate-200">
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-full border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] hover:border-slate-500"
            >
              &lt; Back
            </button>
          )}
          <p className="font-semibold">{otherUserAlias}</p>
        </div>
      </header>

      {/* Islamic reminder - only for female users */}
      {userGender === 'FEMALE' && (
        <div className="border-b border-slate-800 bg-slate-950/80 px-4 py-2 text-[11px] text-slate-300">
          Remember: keep communication halal. Avoid unnecessary free-mixing and involve your wali
          where appropriate.
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-xs"
      >
        {isLoadingOlder && (
          <p className="text-center text-[11px] text-slate-500">Loading older messages...</p>
        )}
        {isLoading && messages.length > 0 ? (
          <p className="text-center text-slate-500">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-slate-500">No messages yet. Start the conversation!</p>
        ) : (
          uniqueMessages.map((msg, index) => (
            <div
              key={`${msg.id || 'message'}-${index}`}
              className={`flex ${msg.isFromMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[70%] space-y-0.5">
                <div
                  className={`rounded-2xl px-3 py-2 ${
                    msg.isFromMe
                      ? 'rounded-br-sm bg-accent-500 text-slate-950'
                      : 'rounded-bl-sm bg-slate-800 text-slate-100'
                  }`}
                >
                  {msg.content}
                </div>
                <div
                  className={`flex items-center gap-1 text-[10px] ${msg.isFromMe ? 'justify-end' : 'justify-start'}`}
                >
                  <span className="text-slate-500">{formatMessageTime(msg.createdAt)}</span>
                  {msg.isFromMe && (
                    <span className="text-slate-500">{getModerationStatusLabel(msg)}</span>
                  )}
                </div>
                {msg.moderationStatus === 'REJECTED' && msg.isFromMe && (
                  <p className="text-right text-[10px] text-red-400">
                    This message was not delivered
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form
        onSubmit={handleSendMessage}
        className="flex flex-col gap-2 border-t border-slate-800 bg-slate-950/90 px-4 py-3"
      >
        <textarea
          ref={textareaRef}
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e as unknown as FormEvent);
            }
          }}
          placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
          maxLength={characterLimit}
          className="h-16 w-full resize-none rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
          disabled={isSending}
        />
        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] ${
              characterCount > characterLimit * 0.9 ? 'text-amber-400' : 'text-slate-500'
            }`}
          >
            {characterCount}/{characterLimit}
          </span>
          <button
            type="submit"
            disabled={!messageInput.trim() || isSending}
            className="rounded-full bg-accent-500 px-4 py-1.5 text-[11px] font-semibold text-slate-950 hover:bg-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
        {error && <p className="text-[11px] text-red-400">{error}</p>}
      </form>
    </section>
  );
}

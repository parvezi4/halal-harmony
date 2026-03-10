'use client';

import { useEffect, useRef, useState } from 'react';

export interface MessageEvent {
  threadId: string;
  id: string;
  content: string;
  createdAt: string;
  senderAlias: string;
}

export interface UnreadCountEvent {
  count: number;
}

interface UseMessageSSEProps {
  onMessage?: (_message: MessageEvent) => void; // eslint-disable-line no-unused-vars
  onUnreadCountUpdate?: (_count: number) => void; // eslint-disable-line no-unused-vars
  enabled?: boolean;
}

/**
 * Custom hook for Server-Sent Events (SSE) real-time messaging
 * Automatically manages connection lifecycle and event handling
 */
export function useMessageSSE({
  onMessage,
  onUnreadCountUpdate,
  enabled = true,
}: UseMessageSSEProps = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) {
      // Close existing connection if disabled
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Create EventSource connection
    const eventSource = new EventSource('/api/messages/events');
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('connected', () => {
      setIsConnected(true);
      setError(null);
    });

    eventSource.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data) as Partial<MessageEvent>;
        if (!payload.threadId || !payload.id || !payload.content || !payload.createdAt) {
          return;
        }

        const incomingMessage: MessageEvent = {
          threadId: payload.threadId,
          id: payload.id,
          content: payload.content,
          createdAt: payload.createdAt,
          senderAlias: payload.senderAlias || 'Unknown',
        };

        onMessage?.(incomingMessage);
      } catch (err) {
        console.error('Failed to parse message event:', err);
      }
    });

    eventSource.addEventListener('unread', (event) => {
      try {
        const { count } = JSON.parse(event.data);
        onUnreadCountUpdate?.(count);
      } catch (err) {
        console.error('Failed to parse unread count event:', err);
      }
    });

    eventSource.onerror = () => {
      setIsConnected(false);
      setError('Connection lost. Reconnecting...');
      // EventSource automatically reconnects on error
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, [enabled, onMessage, onUnreadCountUpdate]);

  return {
    isConnected,
    error,
    disconnect: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setIsConnected(false);
      }
    },
  };
}

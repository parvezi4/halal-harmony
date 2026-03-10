'use client';

import { useEffect, useState } from 'react';
import { useMessageSSE } from './useMessageSSE';

/**
 * Unread messages counter component with real-time updates
 * Shows badge with unread message count
 */
export function MessagesCounter() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Connect to SSE for real-time updates
  useMessageSSE({
    onUnreadCountUpdate: (count) => {
      setUnreadCount(count);
      setIsLoading(false);
    },
    enabled: true,
  });

  // Initial fetch
  useEffect(() => {
    fetch('/api/messages/unread')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUnreadCount(data.data.count);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading || unreadCount === 0) {
    return null;
  }

  return (
    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-[9px] font-bold text-slate-950">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  );
}

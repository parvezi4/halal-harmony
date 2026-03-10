'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { initiateThread } from '@/app/actions/messages';

export function SendMessageButton({ recipientId }: { recipientId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSubscriptionLink, setShowSubscriptionLink] = useState(false);

  const handleSendMessage = async () => {
    setIsLoading(true);
    setError(null);
    setShowSubscriptionLink(false);

    try {
      const result = await initiateThread(recipientId);

      if (result.success && result.data) {
        // Navigate to the thread with query param so it auto-selects
        router.push(`/messages?threadId=${result.data.threadId}`);
      } else {
        // Handle errors
        if (result.errors?.subscription) {
          setError(result.errors.subscription);
          setShowSubscriptionLink(true);
        } else if (result.errors?.general) {
          setError(result.errors.general);
        } else {
          setError('Failed to start conversation');
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleSendMessage}
        disabled={isLoading}
        className="w-full rounded-xl border border-accent-500/40 bg-accent-500/10 px-4 py-2.5 text-sm font-semibold text-accent-200 hover:border-accent-500 hover:bg-accent-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Starting conversation...' : 'Send Message'}
      </button>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-xs text-red-200">{error}</p>
          {showSubscriptionLink && (
            <Link
              href="/pricing"
              className="mt-2 inline-block text-xs font-semibold text-accent-300 hover:text-accent-200"
            >
              View subscription options →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

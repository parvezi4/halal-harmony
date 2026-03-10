'use client';

import { useState, FormEvent } from 'react';
import { initiateThread } from '@/app/actions/messages';

interface NewConversationModalProps {
  onClose: () => void;
  onThreadCreated: (_threadId: string, _recipientId: string) => void; // eslint-disable-line no-unused-vars
}

/**
 * Modal for starting a new conversation
 * Features:
 * - User ID input (could be enhanced with search/autocomplete)
 * - Subscription validation
 * - Error handling (no subscription, same gender, etc.)
 */
export function NewConversationModal({ onClose, onThreadCreated }: NewConversationModalProps) {
  const [recipientId, setRecipientId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!recipientId.trim()) {
      setError('Please enter a user ID');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await initiateThread(recipientId.trim());

    if (result.success && result.data) {
      onThreadCreated(result.data.threadId, recipientId.trim());
      onClose();
    } else {
      setError(
        result.errors?.general || result.errors?.subscription || 'Failed to start conversation'
      );
    }

    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-50">New Conversation</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-xs text-amber-100">
          <p className="font-semibold">⚠️ Premium Feature</p>
          <p className="mt-1 text-[11px]">
            To start a conversation, either you or the recipient must have an active subscription.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="recipientId" className="mb-2 block text-sm text-slate-300">
              Recipient User ID
            </label>
            <input
              id="recipientId"
              type="text"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              placeholder="Enter user ID (e.g., from search results)"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-slate-500">
              Tip: Copy the user ID from their profile page
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-full bg-accent-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Starting...' : 'Start Conversation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

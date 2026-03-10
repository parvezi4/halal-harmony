'use client';

import { useState } from 'react';
import { approveMessage, rejectMessage } from '@/app/actions/admin/moderation';

interface PendingMessage {
  id: string;
  content: string;
  createdAt: string;
  flaggedReason: string | null;
  sender: {
    id: string;
    email: string;
    alias: string;
    fullName: string | null | undefined;
  };
  thread: {
    id: string;
    participants: Array<{
      id: string;
      alias: string;
    }>;
    recentMessages: Array<{
      content: string;
      createdAt: string;
      senderAlias: string;
    }>;
  };
}

interface ModerationQueueClientProps {
  initialMessages: PendingMessage[];
}

export function ModerationQueueClient({ initialMessages }: ModerationQueueClientProps) {
  const [messages, setMessages] = useState<PendingMessage[]>(initialMessages);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (messageId: string) => {
    setProcessingId(messageId);
    const result = await approveMessage(messageId);

    if (result.success) {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } else {
      window.alert(result.errors?.general || 'Failed to approve message');
    }
    setProcessingId(null);
  };

  const handleReject = async (messageId: string) => {
    const warning = window.prompt(
      'Optional: Enter a warning message for the sender (or leave blank):'
    );
    setProcessingId(messageId);
    const result = await rejectMessage(messageId, warning || undefined);

    if (result.success) {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } else {
      window.alert(result.errors?.general || 'Failed to reject message');
    }
    setProcessingId(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (messages.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-8 text-center">
        <p className="text-sm text-slate-400">✓ All clear! No messages pending review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => {
        const isExpanded = expandedId === msg.id;
        const isProcessing = processingId === msg.id;

        return (
          <div key={msg.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            {/* Message header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-50">{msg.sender.alias}</p>
                  <span className="text-xs text-slate-500">({msg.sender.email})</span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-400">{formatDate(msg.createdAt)}</span>
                </div>
                {msg.flaggedReason && (
                  <p className="mt-1 text-xs text-amber-400">⚠️ {msg.flaggedReason}</p>
                )}
              </div>
              <button
                onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                {isExpanded ? 'Hide Context' : 'Show Context'}
              </button>
            </div>

            {/* Message content */}
            <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950/60 p-3">
              <p className="text-sm text-slate-100">{msg.content}</p>
            </div>

            {/* Thread context */}
            {isExpanded && (
              <div className="mt-3 space-y-2 rounded-lg border border-slate-700 bg-slate-950/40 p-3">
                <p className="text-xs font-semibold text-slate-400">THREAD CONTEXT</p>
                <div className="flex gap-2 text-xs text-slate-500">
                  <span>Participants:</span>
                  {msg.thread.participants.map((p, idx) => (
                    <span key={p.id}>
                      {p.alias}
                      {idx < msg.thread.participants.length - 1 && ', '}
                    </span>
                  ))}
                </div>
                {msg.thread.recentMessages.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-slate-500">Recent messages:</p>
                    {msg.thread.recentMessages.map((m, idx) => (
                      <div key={idx} className="text-xs text-slate-400">
                        <span className="font-semibold">{m.senderAlias}:</span> {m.content}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => handleApprove(msg.id)}
                disabled={isProcessing}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : '✓ Approve'}
              </button>
              <button
                onClick={() => handleReject(msg.id)}
                disabled={isProcessing}
                className="flex-1 rounded-lg border border-red-600 bg-red-600/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-600/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : '✕ Reject'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

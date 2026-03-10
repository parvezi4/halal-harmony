'use client';

import { useState } from 'react';

export default function ModerationSettingsPage() {
  // In MVP, these are hardcoded. In future, they would be persisted to database
  const [moderationType, setModerationType] = useState<'PATTERN' | 'AI_NLP'>('PATTERN');
  const [workflow, setWorkflow] = useState<'PRE_MODERATION' | 'POST_MODERATION'>('PRE_MODERATION');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement database persistence
    // For now, just simulate save
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    window.alert('Settings saved! (Note: In MVP, these are not persisted to database)');
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Moderation Settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Configure content moderation behavior for the platform
        </p>
      </header>

      <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-xs text-amber-100">
        <p className="font-semibold">⚠️ MVP Notice</p>
        <p className="mt-1">
          Settings UI is functional but changes are not persisted to database in the current MVP.
          Default configuration is hardcoded in{' '}
          <code className="rounded bg-slate-950 px-1">src/lib/moderation/contentFilter.ts</code>.
        </p>
      </div>

      {/* Moderation Type */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-slate-50">Moderation Type</h2>
        <p className="mt-1 text-xs text-slate-400">
          Choose the content filtering approach for message moderation
        </p>

        <div className="mt-4 space-y-3">
          <label className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-950/60 p-4 cursor-pointer hover:border-accent-500">
            <input
              type="radio"
              name="moderationType"
              value="PATTERN"
              checked={moderationType === 'PATTERN'}
              onChange={(e) => setModerationType(e.target.value as 'PATTERN')}
              className="mt-1"
            />
            <div>
              <p className="font-semibold text-slate-200">Pattern Matching</p>
              <p className="mt-1 text-xs text-slate-400">
                Uses predefined patterns and keywords to detect profanity, sexual content, contact
                info sharing, and other violations. Fast and reliable but may have false positives.
              </p>
              <span className="mt-2 inline-block rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] text-green-400">
                ACTIVE (MVP)
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-950/60 p-4 cursor-pointer hover:border-accent-500">
            <input
              type="radio"
              name="moderationType"
              value="AI_NLP"
              checked={moderationType === 'AI_NLP'}
              onChange={(e) => setModerationType(e.target.value as 'AI_NLP')}
              className="mt-1"
            />
            <div>
              <p className="font-semibold text-slate-200">AI/NLP Analysis</p>
              <p className="mt-1 text-xs text-slate-400">
                Uses machine learning and natural language processing to understand context and
                intent. More accurate but requires external API integration.
              </p>
              <span className="mt-2 inline-block rounded-full bg-slate-500/20 px-2 py-0.5 text-[10px] text-slate-400">
                INTERFACE READY (Not Implemented)
              </span>
            </div>
          </label>
        </div>
      </section>

      {/* Moderation Workflow */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-slate-50">Moderation Workflow</h2>
        <p className="mt-1 text-xs text-slate-400">
          Determine when messages are reviewed by moderators
        </p>

        <div className="mt-4 space-y-3">
          <label className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-950/60 p-4 cursor-pointer hover:border-accent-500">
            <input
              type="radio"
              name="workflow"
              value="PRE_MODERATION"
              checked={workflow === 'PRE_MODERATION'}
              onChange={(e) => setWorkflow(e.target.value as 'PRE_MODERATION')}
              className="mt-1"
            />
            <div>
              <p className="font-semibold text-slate-200">Pre-Moderation</p>
              <p className="mt-1 text-xs text-slate-400">
                Flagged messages are held in queue for admin review before delivery. Safer but may
                delay communication. Clean messages are delivered immediately.
              </p>
              <span className="mt-2 inline-block rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] text-green-400">
                ACTIVE (MVP)
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-950/60 p-4 cursor-pointer hover:border-accent-500">
            <input
              type="radio"
              name="workflow"
              value="POST_MODERATION"
              checked={workflow === 'POST_MODERATION'}
              onChange={(e) => setWorkflow(e.target.value as 'POST_MODERATION')}
              className="mt-1"
            />
            <div>
              <p className="font-semibold text-slate-200">Post-Moderation</p>
              <p className="mt-1 text-xs text-slate-400">
                All messages are delivered immediately, flagged messages are reviewed after the
                fact. Faster user experience but potential for brief exposure to violations.
              </p>
              <span className="mt-2 inline-block rounded-full bg-slate-500/20 px-2 py-0.5 text-[10px] text-slate-400">
                INTERFACE READY (Not Active)
              </span>
            </div>
          </label>
        </div>
      </section>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-full bg-accent-500 px-6 py-2 text-sm font-semibold text-slate-950 hover:bg-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

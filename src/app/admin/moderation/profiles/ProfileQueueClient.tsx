'use client';

import { useState } from 'react';
import { approveProfile, suspendProfile } from '@/app/actions/admin/profiles';

interface PendingProfile {
  id: string;
  userId: string;
  email: string;
  alias: string;
  fullName: string | null;
  gender: 'MALE' | 'FEMALE';
  country: string | null;
  city: string | null;
  onboardingCompletedAt: string | null;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'SUSPENDED';
  photoCount: number;
}

interface ProfileQueueClientProps {
  initialProfiles: PendingProfile[];
}

export default function ProfileQueueClient({ initialProfiles }: ProfileQueueClientProps) {
  const [profiles, setProfiles] = useState<PendingProfile[]>(initialProfiles);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const formatDate = (dateString: string | null) => {
    if (!dateString) {
      return 'Not completed';
    }

    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleApprove = async (profileId: string) => {
    setProcessingId(profileId);
    const result = await approveProfile(profileId);

    if (result.success) {
      setProfiles((prev) => prev.filter((profile) => profile.id !== profileId));
    } else {
      window.alert(('errors' in result && result.errors?.general) || 'Failed to approve profile');
    }

    setProcessingId(null);
  };

  const handleSuspend = async (profileId: string) => {
    const reason = window.prompt('Optional: reason for suspension');
    setProcessingId(profileId);
    const result = await suspendProfile(profileId, reason || undefined);

    if (result.success) {
      setProfiles((prev) => prev.filter((profile) => profile.id !== profileId));
    } else {
      window.alert(('errors' in result && result.errors?.general) || 'Failed to suspend profile');
    }

    setProcessingId(null);
  };

  if (profiles.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-8 text-center">
        <p className="text-sm text-slate-400">No profiles pending verification.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {profiles.map((profile) => {
        const isProcessing = processingId === profile.id;

        return (
          <div key={profile.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">{profile.alias}</p>
                <p className="text-xs text-slate-400">{profile.email}</p>
              </div>
              <p className="text-xs text-slate-400">
                Completed: <span className="text-slate-300">{formatDate(profile.onboardingCompletedAt)}</span>
              </p>
            </div>

            <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2 lg:grid-cols-4">
              <p>
                Full name: <span className="text-slate-200">{profile.fullName || 'Not set'}</span>
              </p>
              <p>
                Gender: <span className="text-slate-200">{profile.gender}</span>
              </p>
              <p>
                Location:{' '}
                <span className="text-slate-200">
                  {[profile.city, profile.country].filter(Boolean).join(', ') || 'Not set'}
                </span>
              </p>
              <p>
                Photos: <span className="text-slate-200">{profile.photoCount}</span>
              </p>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => handleApprove(profile.id)}
                disabled={isProcessing}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Approve Profile'}
              </button>
              <button
                onClick={() => handleSuspend(profile.id)}
                disabled={isProcessing}
                className="flex-1 rounded-lg border border-red-600 bg-red-600/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-600/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Suspend Profile'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

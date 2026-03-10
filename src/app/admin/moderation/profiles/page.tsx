import { getPendingProfiles } from '@/app/actions/admin/profiles';
import ProfileQueueClient from './ProfileQueueClient';

export default async function ProfileModerationPage() {
  const pendingResult = await getPendingProfiles();
  const pendingProfiles = pendingResult.success && 'data' in pendingResult ? pendingResult.data : [];

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Profile Verification Queue</h1>
        <p className="mt-1 text-sm text-slate-400">
          Review completed onboarding profiles and approve or suspend them.
        </p>
      </header>

      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <p className="text-xs text-slate-400">Pending profiles</p>
        <p className="mt-1 text-2xl font-bold text-amber-400">{pendingProfiles.length}</p>
      </div>

      <ProfileQueueClient initialProfiles={pendingProfiles} />
    </div>
  );
}

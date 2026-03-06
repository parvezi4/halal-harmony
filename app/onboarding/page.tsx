'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingWizard from './OnboardingWizard';
import { getOnboardingProgressAction } from '@/app/actions/onboarding';

type OnboardingProgressResult = Awaited<ReturnType<typeof getOnboardingProgressAction>>;
type OnboardingProgress = NonNullable<OnboardingProgressResult['progress']>;

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);

  useEffect(() => {
    async function fetchProgress() {
      console.log('[OnboardingPage] Fetching progress...');
      const result = await getOnboardingProgressAction();
      console.log('[OnboardingPage] Progress result:', result);
      if (result.progress) {
        setProgress(result.progress);
        if (result.progress.isComplete) {
          console.log('[OnboardingPage] Onboarding complete, redirecting to completion page');
          // If onboarding is already complete, redirect to completion page (not dashboard)
          // This allows users to see the congratulations page and upload photos
          router.push('/onboarding/complete');
        } else {
          // Check if male user has completed all 4 steps but onboarding not marked complete
          const profile = result.progress.profile;
          if (
            profile?.gender === 'MALE' &&
            profile.step1Complete &&
            profile.step2Complete &&
            profile.step3Complete &&
            profile.step4Complete
          ) {
            console.log(
              '[OnboardingPage] Male with all 4 steps complete, redirecting to completion page'
            );
            router.push('/onboarding/complete');
            return;
          }
          // Check if female user has completed all 5 steps but onboarding not marked complete
          if (
            profile?.gender === 'FEMALE' &&
            profile.step1Complete &&
            profile.step2Complete &&
            profile.step3Complete &&
            profile.step4Complete &&
            profile.step5Complete
          ) {
            console.log(
              '[OnboardingPage] Female with all 5 steps complete, redirecting to completion page'
            );
            router.push('/onboarding/complete');
            return;
          }
          console.log('[OnboardingPage] Onboarding incomplete, showing wizard');
        }
      }
      setLoading(false);
    }
    fetchProgress();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Don't render wizard if profile is complete (already redirecting)
  if (!progress || progress.isComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <OnboardingWizard initialProgress={progress} />;
}

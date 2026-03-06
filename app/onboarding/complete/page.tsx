import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/auth';
import { getOnboardingProgress, markOnboardingComplete } from '@/lib/auth/profileStatus';

export default async function OnboardingCompletePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  // Get current progress
  const progress = await getOnboardingProgress(session.user.id);

  if (!progress) {
    redirect('/onboarding');
  }

  // Safety check: If all required steps are complete but onboardingCompletedAt is not set, fix it
  const { profile, isComplete } = progress;

  if (!profile) {
    redirect('/onboarding');
  }

  if (!isComplete) {
    const gender = profile.gender;
    const allRequiredStepsComplete =
      gender === 'MALE'
        ? profile.step1Complete &&
          profile.step2Complete &&
          profile.step3Complete &&
          profile.step4Complete
        : profile.step1Complete &&
          profile.step2Complete &&
          profile.step3Complete &&
          profile.step4Complete &&
          profile.step5Complete;

    if (allRequiredStepsComplete && !profile.onboardingCompletedAt) {
      try {
        await markOnboardingComplete(session.user.id);
      } catch (error) {
        console.error('[OnboardingComplete] Auto-complete failed:', error);
        // Continue anyway - the profile data is complete
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="text-6xl text-green-500">OK</div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Congratulations!</h1>

        {/* Message */}
        <p className="text-xl text-gray-300 mb-2">Your profile is now complete</p>
        <p className="text-lg text-green-400 mb-8">Alhamdulillah! 💚</p>

        {/* What&apos;s Next Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-lg font-bold mb-4 text-green-400">What&apos;s Next?</h2>
          <ol className="space-y-3 text-gray-300">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                1
              </span>
              <span>
                <strong>Add a profile photo</strong> (optional but encouraged) <sup>*</sup>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                2
              </span>
              <span>
                <strong>Wait for profile approval</strong> (usually within 24 hours)
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                3
              </span>
              <span>
                <strong>Start searching</strong> for compatible matches
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                4
              </span>
              <span>
                <strong>Connect with potential spouses</strong> within halal guidelines
              </span>
            </li>
          </ol>
          <p className="text-gray-400 text-sm mt-4">
            * Photos appear blurred in search results until both parties approve mutual photo
            exchange.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Link
            href="/onboarding/photo"
            className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            + Add a Profile Photo (Optional)
          </Link>
          <Link
            href="/dashboard"
            className="block w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Additional Resources */}
        <div className="mt-8 pt-8 border-t border-gray-700 space-y-2 text-sm">
          <Link href="/guidelines" className="block text-blue-400 hover:text-blue-300">
            📖 Read Islamic Guidelines
          </Link>
          <Link href="/safety-tips" className="block text-blue-400 hover:text-blue-300">
            🛡️ Review Safety Tips
          </Link>
          <Link href="/contact" className="block text-blue-400 hover:text-blue-300">
            💬 Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}

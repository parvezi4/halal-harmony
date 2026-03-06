'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/solid';
import Step1BasicInfo from './steps/Step1BasicInfo';
import Step2IslamicInfo from './steps/Step2IslamicInfo';
import Step3MaritalFamily from './steps/Step3MaritalFamily';
import Step4Preferences from './steps/Step4Preferences';
import Step5WaliInfo from './steps/Step5WaliInfo';
import {
  saveOnboardingStep1,
  saveOnboardingStep2,
  saveOnboardingStep3,
  saveOnboardingStep4,
  saveOnboardingStep5,
} from '@/app/actions/onboarding';
import type {
  OnboardingStep1FormData,
  OnboardingStep2FormData,
  OnboardingStep3FormData,
  OnboardingStep4FormData,
  OnboardingStep5FemaleFormData,
  OnboardingStep5MaleFormData,
} from '@/lib/validators/onboarding';
import type { Gender } from '@prisma/client';
import { getOnboardingProgressAction } from '@/app/actions/onboarding';

type OnboardingProgressResult = Awaited<ReturnType<typeof getOnboardingProgressAction>>;
type OnboardingProgress = NonNullable<OnboardingProgressResult['progress']>;

interface OnboardingWizardProps {
  initialProgress: OnboardingProgress | null;
}

export default function OnboardingWizard({ initialProgress }: OnboardingWizardProps) {
  const router = useRouter();

  // Calculate the first incomplete step
  const getFirstIncompleteStep = () => {
    if (!initialProgress?.profile) {
      return 1;
    }
    const { profile } = initialProgress;
    const userGender = profile.gender;

    if (!profile.step1Complete) return 1;
    if (!profile.step2Complete) return 2;
    if (!profile.step3Complete) return 3;
    if (!profile.step4Complete) return 4;

    // For males: Step 4 is the last step, so if we're here, they should be redirected
    if (userGender === 'MALE') {
      return 1; // Fallback - onboarding page should have redirected already
    }

    // For females: Check step 5 (Wali info)
    if (!profile.step5Complete) return 5;

    // If we reach here, all steps are complete - onboarding page should have redirected
    return 1; // Fallback - this shouldn't happen
  };

  const [currentStep, setCurrentStep] = useState(() => getFirstIncompleteStep());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [gender, setGender] = useState<Gender | null>(initialProgress?.profile?.gender || null);

  // Initialize gender from profile if available
  useEffect(() => {
    if (initialProgress?.profile?.gender && !gender) {
      setGender(initialProgress.profile.gender);
    }
  }, [initialProgress, gender]);

  // Recalculate current step when initialProgress changes (e.g., after page refresh)
  useEffect(() => {
    const correctStep = getFirstIncompleteStep();
    if (correctStep !== currentStep) {
      setCurrentStep(correctStep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProgress]);

  // Males only have 4 steps (no Wali info), females have 5 steps
  const totalSteps = gender === 'FEMALE' ? 5 : 4;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const handleStepData = (
    stepData:
      | OnboardingStep1FormData
      | OnboardingStep2FormData
      | OnboardingStep3FormData
      | OnboardingStep4FormData
      | OnboardingStep5FemaleFormData
      | OnboardingStep5MaleFormData
  ) => {
    if ('gender' in stepData && stepData.gender) {
      setGender(stepData.gender);
    }
  };

  const handleSaveAndContinue = async (
    stepData:
      | OnboardingStep1FormData
      | OnboardingStep2FormData
      | OnboardingStep3FormData
      | OnboardingStep4FormData
      | OnboardingStep5FemaleFormData
      | OnboardingStep5MaleFormData
  ) => {
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      let response;
      switch (currentStep) {
        case 1:
          response = await saveOnboardingStep1(stepData as OnboardingStep1FormData);
          handleStepData(stepData);
          break;
        case 2:
          response = await saveOnboardingStep2(stepData as OnboardingStep2FormData);
          handleStepData(stepData);
          break;
        case 3:
          response = await saveOnboardingStep3(stepData as OnboardingStep3FormData);
          handleStepData(stepData);
          break;
        case 4:
          response = await saveOnboardingStep4(stepData as OnboardingStep4FormData);
          handleStepData(stepData);
          break;
        case 5:
          response = await saveOnboardingStep5(
            stepData as OnboardingStep5FemaleFormData | OnboardingStep5MaleFormData
          );
          handleStepData(stepData);
          break;
        default:
          throw new Error('Invalid step');
      }

      if (!response.success) {
        if (response.errors) {
          setFieldErrors(response.errors);
          // Check for blocking errors (e.g., married female)
          if (response.errors.maritalStatus?.includes('AlHarmony is for single sisters')) {
            setError(response.errors.maritalStatus);
            return;
          }
        }
        setError(response.message || 'Failed to save step. Please try again.');
        return;
      }

      // For males, Step 4 is the final step (no Wali info needed)
      // For females, Step 5 is the final step (Wali info required)
      const isFinalStep =
        (gender === 'MALE' && currentStep === 4) || (gender === 'FEMALE' && currentStep === 5);

      if (isFinalStep) {
        // For males completing Step 4, mark onboarding complete with confirmation
        if (gender === 'MALE' && currentStep === 4) {
          const completionResponse = await saveOnboardingStep5({ confirmed: true });
          if (!completionResponse.success) {
            setError('Failed to complete onboarding. Please try again.');
            setLoading(false);
            return;
          }
        }

        // For females completing Step 5, the Wali data was already saved above in the switch statement
        // and markOnboardingComplete was called within saveOnboardingStep5
        if (gender === 'FEMALE' && currentStep === 5) {
          // Extra safety: ensure we redirect even if something went wrong
          setLoading(false);
        }

        // Use window.location as fallback if router.push doesn't work
        try {
          await router.push('/onboarding/complete');
        } catch (error) {
          console.error('[Wizard] Router.push failed:', error);
          window.location.href = '/onboarding/complete';
        }
        return; // Prevent further execution
      } else {
        // Move to next step
        setCurrentStep(currentStep + 1);
      }
    } catch (err) {
      console.error('[Wizard] Error saving step:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
      setFieldErrors({});
    }
  };

  const handleLogout = async () => {
    // Progress is auto-saved as user fills forms, so just logout
    await signOut({ callbackUrl: '/auth/login' });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Complete Your Profile</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-200 hover:bg-slate-800 hover:text-accent-200 transition-colors"
            title="Logout"
          >
            <ArrowLeftOnRectangleIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm md:text-base">
            <span className="text-gray-400">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-gray-400">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-2xl mx-auto">
        {/* Error Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Steps */}
        {currentStep === 1 && (
          <Step1BasicInfo
            onData={handleStepData}
            onSaveAndContinue={handleSaveAndContinue}
            loading={loading}
            fieldErrors={fieldErrors}
            initialData={
              initialProgress?.profile
                ? {
                    fullName: initialProgress.profile.fullName || undefined,
                    gender: initialProgress.profile.gender,
                    dateOfBirth: initialProgress.profile.dateOfBirth || undefined,
                    nationality: initialProgress.profile.nationality || undefined,
                    country: initialProgress.profile.country || undefined,
                    city: initialProgress.profile.city || undefined,
                    ethnicity: initialProgress.profile.ethnicity || undefined,
                  }
                : undefined
            }
          />
        )}
        {currentStep === 2 && gender && (
          <Step2IslamicInfo
            onData={handleStepData}
            onSaveAndContinue={handleSaveAndContinue}
            loading={loading}
            gender={gender}
            fieldErrors={fieldErrors}
            initialData={
              (initialProgress?.profile
                ? {
                    practicingLevel: initialProgress.profile.practicingLevel,
                    prayerHabit: initialProgress.profile.prayerHabit,
                    height: initialProgress.profile.height,
                    bodyShape: initialProgress.profile.bodyShape,
                    weight: initialProgress.profile.weight,
                    hijabOrBeard: initialProgress.profile.hijabOrBeard,
                    madhhabOrManhaj: initialProgress.profile.madhhabOrManhaj,
                  }
                : undefined) as Partial<OnboardingStep2FormData> | undefined
            }
          />
        )}
        {currentStep === 3 && gender && (
          <Step3MaritalFamily
            onData={handleStepData}
            onSaveAndContinue={handleSaveAndContinue}
            loading={loading}
            gender={gender}
            fieldErrors={fieldErrors}
            initialData={
              (initialProgress?.profile
                ? {
                    maritalStatus: initialProgress.profile.maritalStatus,
                    numberOfChildren: initialProgress.profile.numberOfChildren,
                    childrenLivingWithMe: initialProgress.profile.childrenLivingWithMe,
                    willingToRelocate: initialProgress.profile.willingToRelocate,
                    relocateNotes: initialProgress.profile.relocateNotes,
                  }
                : undefined) as Partial<OnboardingStep3FormData> | undefined
            }
          />
        )}
        {currentStep === 4 && gender && (
          <Step4Preferences
            onData={handleStepData}
            onSaveAndContinue={handleSaveAndContinue}
            loading={loading}
            gender={gender}
            fieldErrors={fieldErrors}
            initialData={
              (initialProgress?.profile?.spouseStatusPreferences
                ? {
                    spouseStatusPreferences: initialProgress.profile.spouseStatusPreferences,
                  }
                : undefined) as Partial<OnboardingStep4FormData> | undefined
            }
          />
        )}
        {currentStep === 5 && gender === 'FEMALE' && (
          <Step5WaliInfo
            onData={handleStepData}
            onSaveAndContinue={handleSaveAndContinue}
            loading={loading}
            gender={gender}
            fieldErrors={fieldErrors}
            initialData={
              (initialProgress?.profile
                ? {
                    waliName: initialProgress.profile.waliName,
                    waliRelationship: initialProgress.profile.waliRelationship,
                    waliEmail: initialProgress.profile.waliEmail,
                    waliPhone: initialProgress.profile.waliPhone,
                  }
                : undefined) as Partial<OnboardingStep5FemaleFormData> | undefined
            }
          />
        )}

        {/* Info Message */}
        <div className="mt-6 p-4 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg">
          <p className="text-blue-200 text-sm">
            💡 Your progress is automatically saved. You can logout anytime and continue later.
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
            className="flex items-center gap-2 px-6 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <span>{'<'}</span>
            Back
          </button>
          <button
            onClick={() => {
              const stepForm = document.querySelector('form');
              if (stepForm) {
                stepForm.dispatchEvent(new Event('submit', { bubbles: true }));
              }
            }}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
          >
            {loading
              ? 'Saving...'
              : currentStep === totalSteps
                ? 'Complete Profile'
                : 'Save & Continue'}
            {!loading && <span>{'>'}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

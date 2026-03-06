'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  validateOnboardingStep,
  OnboardingStep1FormData,
  OnboardingStep2FormData,
  OnboardingStep3FormData,
  OnboardingStep4FormData,
  OnboardingStep5FemaleFormData,
  OnboardingStep5MaleFormData,
} from '@/lib/validators/onboarding';
import { getOnboardingProgress, markOnboardingComplete } from '@/lib/auth/profileStatus';

export type SaveStepResponse = {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
};

/**
 * Save Step 1: Basic Information
 */
export async function saveOnboardingStep1(
  formData: OnboardingStep1FormData
): Promise<SaveStepResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, errors: { general: 'Unauthorized' } };
    }

    const userId = session.user.id;

    // Validate step 1
    const validation = await validateOnboardingStep(1, formData, formData.gender);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // Save to database
    await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        fullName: formData.fullName,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        nationality: formData.nationality,
        country: formData.country,
        city: formData.city || null,
        ethnicity: formData.ethnicity || null,
      },
      update: {
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        nationality: formData.nationality,
        country: formData.country,
        city: formData.city || null,
        ethnicity: formData.ethnicity || null,
      },
    });

    return { success: true, message: 'Step 1 saved successfully' };
  } catch (error) {
    console.error('Error saving onboarding step 1:', error);
    return { success: false, errors: { general: 'Failed to save step 1' } };
  }
}

/**
 * Save Step 2: Islamic Details
 */
export async function saveOnboardingStep2(
  formData: OnboardingStep2FormData
): Promise<SaveStepResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, errors: { general: 'Unauthorized' } };
    }

    const userId = session.user.id;

    // Get user's gender for validation
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { gender: true },
    });

    if (!profile) {
      return { success: false, errors: { general: 'Profile not found. Complete Step 1 first.' } };
    }

    // Validate step 2
    const validation = await validateOnboardingStep(2, formData, profile.gender);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // Save to database
    await prisma.profile.update({
      where: { userId },
      data: {
        practicingLevel: formData.practicingLevel,
        prayerHabit: formData.prayerHabit,
        height: formData.height,
        bodyShape: formData.bodyShape,
        weight: formData.weight || null,
        hijabOrBeard: formData.hijabOrBeard,
        madhhabOrManhaj: formData.madhhabOrManhaj,
      },
    });

    return { success: true, message: 'Step 2 saved successfully' };
  } catch (error) {
    console.error('Error saving onboarding step 2:', error);
    return { success: false, errors: { general: 'Failed to save step 2' } };
  }
}

/**
 * Save Step 3: Marital Status & Family
 */
export async function saveOnboardingStep3(
  formData: OnboardingStep3FormData
): Promise<SaveStepResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, errors: { general: 'Unauthorized' } };
    }

    const userId = session.user.id;

    // Get user's gender for validation
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { gender: true },
    });

    if (!profile) {
      return { success: false, errors: { general: 'Profile not found. Complete Step 1 first.' } };
    }

    // Validate step 3
    const validation = await validateOnboardingStep(3, formData, profile.gender);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // Save to database
    await prisma.profile.update({
      where: { userId },
      data: {
        maritalStatus: formData.maritalStatus,
        numberOfChildren: formData.numberOfChildren || 0,
        childrenLivingWithMe: formData.childrenLivingWithMe || null,
        willingToRelocate: formData.willingToRelocate,
        relocateNotes: formData.relocateNotes || null,
      },
    });

    return { success: true, message: 'Step 3 saved successfully' };
  } catch (error) {
    console.error('Error saving onboarding step 3:', error);
    return { success: false, errors: { general: 'Failed to save step 3' } };
  }
}

/**
 * Save Step 4: Preferences
 */
export async function saveOnboardingStep4(
  formData: OnboardingStep4FormData
): Promise<SaveStepResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, errors: { general: 'Unauthorized' } };
    }

    const userId = session.user.id;

    // Get user's gender
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { gender: true },
    });

    if (!profile) {
      return { success: false, errors: { general: 'Profile not found. Complete Step 1 first.' } };
    }

    // Validate step 4
    const validation = await validateOnboardingStep(4, formData, profile.gender);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // Save to database
    await prisma.profile.update({
      where: { userId },
      data: {
        spouseStatusPreferences: JSON.stringify(formData.spouseStatusPreferences),
      },
    });

    return { success: true, message: 'Step 4 saved successfully' };
  } catch (error) {
    console.error('Error saving onboarding step 4:', error);
    return { success: false, errors: { general: 'Failed to save step 4' } };
  }
}

/**
 * Save Step 5: Wali Info (Female) or Complete (Male)
 */
export async function saveOnboardingStep5(
  formData: OnboardingStep5FemaleFormData | OnboardingStep5MaleFormData
): Promise<SaveStepResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, errors: { general: 'Unauthorized' } };
    }

    const userId = session.user.id;

    // Get user's gender
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { gender: true },
    });

    if (!profile) {
      return { success: false, errors: { general: 'Profile not found. Complete Step 1 first.' } };
    }

    // Validate step 5
    const validation = await validateOnboardingStep(5, formData, profile.gender);

    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // Save to database
    if (profile.gender === 'FEMALE') {
      const femaleData = formData as OnboardingStep5FemaleFormData;
      await prisma.profile.update({
        where: { userId },
        data: {
          waliName: femaleData.waliName,
          waliRelationship: femaleData.waliRelationship,
          waliEmail: femaleData.waliEmail,
          waliPhone: femaleData.waliPhone,
        },
      });
    }
    // For males, no wali data to save

    // Mark onboarding as complete
    await markOnboardingComplete(userId);

    return { success: true, message: 'Profile completed successfully!' };
  } catch (error) {
    console.error('[saveOnboardingStep5] Error:', error);
    return { success: false, errors: { general: 'Failed to save step 5' } };
  }
}

/**
 * Get current onboarding progress for the logged-in user
 */
export async function getOnboardingProgressAction(): Promise<{
  progress: Awaited<ReturnType<typeof getOnboardingProgress>> | null;
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { progress: null, error: 'Unauthorized' };
    }

    const progress = await getOnboardingProgress(session.user.id);
    return { progress };
  } catch (error) {
    console.error('Error getting onboarding progress:', error);
    return { progress: null, error: 'Failed to get progress' };
  }
}

/**
 * Auto-complete onboarding if all required steps are done but onboardingCompletedAt is not set.
 * This is a safety mechanism to fix the profile if the wizard didn't properly mark completion.
 */
export async function autoCompleteOnboardingIfNeeded(): Promise<{
  success: boolean;
  wasCompleted: boolean;
  message?: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, wasCompleted: false, message: 'Unauthorized' };
    }

    const userId = session.user.id;
    const progress = await getOnboardingProgress(userId);

    if (!progress) {
      return { success: false, wasCompleted: false, message: 'Profile not found' };
    }

    const { profile, isComplete } = progress;

    // Already complete
    if (isComplete) {
      return { success: true, wasCompleted: false, message: 'Already complete' };
    }

    // Check if all required steps are done
    if (!profile) {
      return { success: false, wasCompleted: false, message: 'Profile not found' };
    }

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
      await markOnboardingComplete(userId);
      return { success: true, wasCompleted: true, message: 'Profile auto-completed' };
    }

    return { success: true, wasCompleted: false, message: 'Steps incomplete' };
  } catch (error) {
    console.error('[autoCompleteOnboardingIfNeeded] Error:', error);
    return { success: false, wasCompleted: false, message: 'Failed to check completion' };
  }
}

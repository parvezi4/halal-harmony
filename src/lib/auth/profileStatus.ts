import { prisma } from '@/lib/prisma';

/**
 * Check if a user's profile is complete (all mandatory onboarding fields are filled)
 */
export async function isProfileComplete(userId: string): Promise<boolean> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return false;
  }

  // Profile is only complete if onboardingCompletedAt is set
  return profile.onboardingCompletedAt != null;
}

/**
 * Get onboarding progress for a user (which steps are complete)
 */
export async function getOnboardingProgress(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      gender: true,
      fullName: true,
      dateOfBirth: true,
      nationality: true,
      country: true,
      city: true,
      ethnicity: true,
      practicingLevel: true,
      prayerHabit: true,
      height: true,
      bodyShape: true,
      weight: true,
      hijabOrBeard: true,
      madhhabOrManhaj: true,
      maritalStatus: true,
      numberOfChildren: true,
      childrenLivingWithMe: true,
      willingToRelocate: true,
      relocateNotes: true,
      spouseStatusPreferences: true,
      waliName: true,
      waliRelationship: true,
      waliEmail: true,
      waliPhone: true,
      onboardingCompletedAt: true,
    },
  });

  if (!profile) {
    return {
      totalSteps: 5,
      completedSteps: 0,
      lastCompletedStep: 0,
      isComplete: false,
      profile: null,
    };
  }

  const step1Complete =
    !!profile.fullName && !!profile.dateOfBirth && !!profile.nationality && !!profile.country;

  const step2Complete =
    !!profile.practicingLevel &&
    !!profile.prayerHabit &&
    !!profile.height &&
    !!profile.bodyShape &&
    !!profile.hijabOrBeard &&
    !!profile.madhhabOrManhaj;

  const step3Complete = !!profile.maritalStatus && profile.willingToRelocate != null;

  const step4Complete = !!profile.spouseStatusPreferences;

  // Step 5 only exists for females (Wali info)
  // For males: Step 4 is the final step, so step5Complete is same as onboarding complete
  // For females: need wali info filled
  const step5Complete =
    profile.gender === 'MALE'
      ? !!profile.onboardingCompletedAt // Males don't have Step 5, only check if onboarding is done
      : !!profile.waliName && !!profile.waliEmail && !!profile.waliPhone;

  let lastCompletedStep = 0;
  if (step1Complete) lastCompletedStep = 1;
  if (step2Complete) lastCompletedStep = 2;
  if (step3Complete) lastCompletedStep = 3;
  if (step4Complete) lastCompletedStep = 4;
  if (step5Complete) lastCompletedStep = 5;

  return {
    totalSteps: 5,
    completedSteps: [
      step1Complete,
      step2Complete,
      step3Complete,
      step4Complete,
      step5Complete,
    ].filter(Boolean).length,
    lastCompletedStep,
    isComplete: profile.onboardingCompletedAt != null,
    profile: {
      ...profile,
      step1Complete,
      step2Complete,
      step3Complete,
      step4Complete,
      step5Complete,
    },
  };
}

/**
 * Mark profile as onboarding complete
 */
export async function markOnboardingComplete(userId: string): Promise<void> {
  console.log('[markOnboardingComplete] Starting for userId:', userId);
  try {
    await prisma.profile.update({
      where: { userId },
      data: {
        onboardingCompletedAt: new Date(),
        status: 'PENDING_REVIEW', // Set status to pending review for admin approval
      },
    });
    console.log('[markOnboardingComplete] Successfully updated profile');
  } catch (error) {
    console.error('[markOnboardingComplete] Error updating profile:', error);
    throw error; // Re-throw to let caller handle it
  }
}

/**
 * Get user's profile by user ID
 */
export async function getUserProfile(userId: string) {
  return prisma.profile.findUnique({
    where: { userId },
  });
}

'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ProfileUpdateSchema, type ProfileUpdateFormData } from '@/lib/validators/profileUpdate';

export type ActionResponse = {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
};

/**
 * Get complete profile data for the current user
 */
export async function getProfileData(): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, errors: { general: 'Unauthorized' } };
    }

    const userId = session.user.id;

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!profile) {
      return { success: false, errors: { general: 'Profile not found' } };
    }

    // Convert to a format suitable for the form
    const profileData = {
      ...profile,
      email: profile.user.email,
      // Parse JSON fields
      spouseStatusPreferences: profile.spouseStatusPreferences
        ? JSON.parse(profile.spouseStatusPreferences)
        : [],
    };

    return { success: true, data: profileData };
  } catch (error) {
    console.error('Error fetching profile data:', error);
    return { success: false, errors: { general: 'Failed to fetch profile data' } };
  }
}

/**
 * Update profile data with validation
 */
export async function updateProfile(formData: ProfileUpdateFormData): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, errors: { general: 'Unauthorized' } };
    }

    const userId = session.user.id;

    // Get current profile to check gender
    const currentProfile = await prisma.profile.findUnique({
      where: { userId },
      select: { gender: true },
    });

    if (!currentProfile) {
      return { success: false, errors: { general: 'Profile not found' } };
    }

    // Validate data with gender-specific rules
    const validation = ProfileUpdateSchema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      return { success: false, errors: fieldErrors };
    }

    const validData = validation.data;

    // Gender-specific validation: Females must have wali info
    if (currentProfile.gender === 'FEMALE') {
      if (
        !validData.waliName ||
        !validData.waliEmail ||
        !validData.waliRelationship ||
        !validData.waliPhone
      ) {
        const waliErrors: Record<string, string> = {};
        if (!validData.waliName) waliErrors.waliName = 'Wali name is required for female profiles';
        if (!validData.waliEmail)
          waliErrors.waliEmail = 'Wali email is required for female profiles';
        if (!validData.waliRelationship)
          waliErrors.waliRelationship = 'Wali relationship is required for female profiles';
        if (!validData.waliPhone)
          waliErrors.waliPhone = 'Wali phone is required for female profiles';

        return {
          success: false,
          errors: waliErrors,
        };
      }
    }

    // Update profile
    await prisma.profile.update({
      where: { userId },
      data: {
        fullName: validData.fullName,
        dateOfBirth: validData.dateOfBirth,
        nationality: validData.nationality,
        country: validData.country,
        city: validData.city || null,
        ethnicity: validData.ethnicity || null,
        practicingLevel: validData.practicingLevel,
        prayerHabit: validData.prayerHabit,
        height: validData.height,
        bodyShape: validData.bodyShape,
        weight: validData.weight || null,
        hijabOrBeard: validData.hijabOrBeard,
        madhhabOrManhaj: validData.madhhabOrManhaj,
        maritalStatus: validData.maritalStatus,
        numberOfChildren: validData.numberOfChildren,
        childrenLivingWithMe: validData.childrenLivingWithMe || null,
        willingToRelocate: validData.willingToRelocate,
        relocateNotes: validData.relocateNotes || null,
        spouseStatusPreferences: JSON.stringify(validData.spouseStatusPreferences),
        waliName: validData.waliName || null,
        waliRelationship: validData.waliRelationship || null,
        waliEmail: validData.waliEmail || null,
        waliPhone: validData.waliPhone || null,
        about: validData.about || null,
        education: validData.education || null,
        profession: validData.profession || null,
        familyBackground: validData.familyBackground || null,
      },
    });

    return { success: true, message: 'Profile updated successfully' };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, errors: { general: 'Failed to update profile' } };
  }
}

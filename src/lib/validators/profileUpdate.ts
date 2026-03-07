import { z } from 'zod';
import {
  OnboardingStep1Schema,
  OnboardingStep2Schema,
  OnboardingStep3Schema,
  OnboardingStep4Schema,
  OnboardingStep5FemaleSchema,
} from './onboarding';

/**
 * Combined schema for profile updates
 * Merges all onboarding steps + additional profile fields
 */
export const ProfileUpdateSchema = OnboardingStep1Schema.merge(OnboardingStep2Schema)
  .merge(OnboardingStep3Schema)
  .merge(OnboardingStep4Schema)
  .merge(
    // Make wali fields optional since they're only required for females
    // (gender-specific validation happens in the server action)
    OnboardingStep5FemaleSchema.partial()
  )
  .extend({
    // Additional profile fields not in onboarding
    about: z.string().max(1000, 'About must not exceed 1000 characters').optional().nullable(),
    education: z
      .string()
      .max(200, 'Education must not exceed 200 characters')
      .optional()
      .nullable(),
    profession: z
      .string()
      .max(200, 'Profession must not exceed 200 characters')
      .optional()
      .nullable(),
    familyBackground: z
      .string()
      .max(1000, 'Family background must not exceed 1000 characters')
      .optional()
      .nullable(),
  });

export type ProfileUpdateFormData = z.infer<typeof ProfileUpdateSchema>;

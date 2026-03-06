import { z } from 'zod';

/**
 * Regex patterns for validation
 */
const NO_CONTACT_INFO_PATTERN = /[@#$%^&*()_+=\[\]{};':"\\|,.<>?\n\t/]/;
const PHONE_PATTERN = /^\+?[\d\s\-()]{7,}$/;

function flattenFieldErrors(
  fieldErrors: Record<string, string[] | undefined>
): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(fieldErrors)) {
    if (value && value.length > 0) {
      normalized[key] = value[0];
    }
  }
  return normalized;
}

/**
 * Utility functions
 */

/**
 * Check if a string contains contact info patterns (email, phone, URLs, social handles)
 */
export function containsContactInfo(text: string): boolean {
  return NO_CONTACT_INFO_PATTERN.test(text);
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

/**
 * STEP 1: Basic Information (Mandatory)
 */
export const OnboardingStep1Schema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .refine((name) => !containsContactInfo(name), 'Name must not contain contact information'),
  gender: z.enum(['MALE', 'FEMALE'], {
    errorMap: () => ({ message: 'Please select a gender' }),
  }),
  dateOfBirth: z.coerce
    .date()
    .refine((dob) => calculateAge(dob) >= 14, 'You must be at least 14 years old to join')
    .refine((dob) => dob < new Date(), 'Date of birth must be in the past'),
  nationality: z
    .string()
    .min(1, 'Nationality is required')
    .max(100, 'Nationality must not exceed 100 characters'),
  country: z
    .string()
    .min(1, 'Country is required')
    .max(100, 'Country must not exceed 100 characters'),
  city: z.string().max(100, 'City must not exceed 100 characters').optional().nullable(),
  ethnicity: z.string().max(100, 'Ethnicity must not exceed 100 characters').optional().nullable(),
});

export type OnboardingStep1FormData = z.infer<typeof OnboardingStep1Schema>;

/**
 * STEP 2: Islamic Details (Mandatory)
 */
export const OnboardingStep2Schema = z.object({
  practicingLevel: z.enum(
    ['Very practicing', 'Practicing', 'Moderate', 'Less practicing', 'Secular'],
    { errorMap: () => ({ message: 'Please select a practicing level' }) }
  ),
  prayerHabit: z.enum(['5 times daily', 'Regularly', 'Sometimes', 'Rarely', 'Never'], {
    errorMap: () => ({ message: 'Please select a prayer frequency' }),
  }),
  height: z.string().min(1, 'Height is required').max(10, 'Invalid height format'),
  bodyShape: z.enum(['Athletic', 'Average', 'Curvy', 'Muscular', 'Plus-size'], {
    errorMap: () => ({ message: 'Please select a body shape' }),
  }),
  weight: z.number().int().positive('Weight must be positive').optional().nullable(),
  hijabOrBeard: z
    .string()
    .min(1, 'This field is required')
    .max(100, 'Must not exceed 100 characters'),
  madhhabOrManhaj: z
    .string()
    .min(1, 'Please select a madhab')
    .max(100, 'Madhab must not exceed 100 characters'),
});

export type OnboardingStep2FormData = z.infer<typeof OnboardingStep2Schema>;

/**
 * STEP 3: Marital Status & Family (Mandatory)
 */
export const OnboardingStep3Schema = z.object({
  maritalStatus: z
    .string()
    .min(1, 'Marital status is required')
    .max(50, 'Must not exceed 50 characters'),
  numberOfChildren: z.number().int().min(0, 'Number of children cannot be negative').default(0),
  childrenLivingWithMe: z.number().int().min(0, 'Cannot be negative').optional().nullable(),
  willingToRelocate: z.enum(['yes', 'maybe', 'no'], {
    errorMap: () => ({ message: 'Please select a relocation preference' }),
  }),
  relocateNotes: z.string().max(200, 'Notes must not exceed 200 characters').optional().nullable(),
});

export type OnboardingStep3FormData = z.infer<typeof OnboardingStep3Schema>;

/**
 * STEP 4: Preferences (Mandatory)
 */
export const OnboardingStep4Schema = z.object({
  spouseStatusPreferences: z
    .array(z.string())
    .min(1, 'Please select at least one preference')
    .max(5, 'Cannot select more than 5 preferences'),
});

export type OnboardingStep4FormData = z.infer<typeof OnboardingStep4Schema>;

/**
 * STEP 5: Wali Info (Mandatory for female, N/A for male)
 */
export const OnboardingStep5FemaleSchema = z.object({
  waliName: z
    .string()
    .min(2, 'Wali name must be at least 2 characters')
    .max(100, 'Wali name must not exceed 100 characters'),
  waliRelationship: z.enum(['Father', 'Brother', 'Uncle', 'Grandfather', 'Imam', 'Other'], {
    errorMap: () => ({ message: 'Please select a valid relationship' }),
  }),
  waliEmail: z.string().email('Please enter a valid email address'),
  waliPhone: z
    .string()
    .min(7, 'Please enter a valid phone number')
    .max(20, 'Phone number must not exceed 20 characters')
    .refine((phone) => PHONE_PATTERN.test(phone), 'Please enter a valid phone number'),
});

export type OnboardingStep5FemaleFormData = z.infer<typeof OnboardingStep5FemaleSchema>;

export const OnboardingStep5MaleSchema = z.object({
  // Males skip wali step; this is just a summary review
  confirmed: z.boolean().default(true),
});

export type OnboardingStep5MaleFormData = z.infer<typeof OnboardingStep5MaleSchema>;

/**
 * Gender-specific marital status validation
 */
// Marital statuses that females can have
export const FEMALE_MARITAL_STATUSES = ['virgin', 'divorced', 'annulled'];
// Marital statuses that males can have
export const MALE_MARITAL_STATUSES = ['virgin', 'married', 'separated'];

// Note: Spouse preferences are inverted - females select male statuses they seek, and vice versa
// What females can select as spouse preferences (male marital statuses)
export const FEMALE_SPOUSE_PREFERENCES = ['virgin', 'married', 'separated'];
// What males can select as spouse preferences (female marital statuses)
export const MALE_SPOUSE_PREFERENCES = ['virgin', 'divorced', 'annulled'];

/**
 * Validate marital status based on gender
 */
export function isValidMaritalStatus(gender: string, maritalStatus: string): boolean {
  if (gender === 'FEMALE') {
    return FEMALE_MARITAL_STATUSES.includes(maritalStatus.toLowerCase());
  } else if (gender === 'MALE') {
    return MALE_MARITAL_STATUSES.includes(maritalStatus.toLowerCase());
  }
  return false;
}

/**
 * Validate spouse preferences based on gender
 * Female users select male marital statuses they're seeking
 * Male users select female marital statuses they're seeking
 */
export function isValidSpousePreference(gender: string, preference: string): boolean {
  if (gender === 'FEMALE') {
    // Females can select male statuses: virgin, married, separated
    return FEMALE_SPOUSE_PREFERENCES.includes(preference.toLowerCase());
  } else if (gender === 'MALE') {
    // Males can select female statuses: virgin, divorced, annulled
    return MALE_SPOUSE_PREFERENCES.includes(preference.toLowerCase());
  }
  return false;
}

/**
 * Validate complete onboarding step
 */
export async function validateOnboardingStep(
  stepNumber: number,
  formData: unknown,
  gender: string
): Promise<{ valid: boolean; errors: Record<string, string> }> {
  let schema: z.ZodSchema;

  switch (stepNumber) {
    case 1:
      schema = OnboardingStep1Schema;
      break;
    case 2:
      schema = OnboardingStep2Schema;
      break;
    case 3: {
      schema = OnboardingStep3Schema;
      const result = schema.safeParse(formData);
      if (!result.success) {
        return {
          valid: false,
          errors: flattenFieldErrors(result.error.flatten().fieldErrors),
        };
      }
      // Additional validation for marital status
      const data = result.data as OnboardingStep3FormData;
      if (!isValidMaritalStatus(gender, data.maritalStatus)) {
        // Special handling for married females
        if (gender === 'FEMALE' && data.maritalStatus.toLowerCase() === 'married') {
          return {
            valid: false,
            errors: {
              maritalStatus:
                'AlHarmony is for single sisters. Married status is not supported at this time.',
            },
          };
        }
        return {
          valid: false,
          errors: { maritalStatus: 'Invalid marital status for your gender' },
        };
      }
      return { valid: true, errors: {} };
    }
    case 4:
      schema = OnboardingStep4Schema;
      break;
    case 5:
      schema = gender === 'FEMALE' ? OnboardingStep5FemaleSchema : OnboardingStep5MaleSchema;
      break;
    default:
      return { valid: false, errors: { general: 'Invalid step number' } };
  }

  const result = schema.safeParse(formData);

  if (!result.success) {
    return {
      valid: false,
      errors: flattenFieldErrors(result.error.flatten().fieldErrors),
    };
  }

  return { valid: true, errors: {} };
}

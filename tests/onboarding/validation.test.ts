import {
  OnboardingStep1Schema,
  OnboardingStep5FemaleSchema,
  validateOnboardingStep,
  isValidMaritalStatus,
  isValidSpousePreference,
  calculateAge,
} from '@/lib/validators/onboarding';

describe('Onboarding Validators', () => {
  describe('calculateAge', () => {
    it('should calculate age correctly', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
      expect(calculateAge(birthDate)).toBe(25);
    });

    it('should handle birthday not yet occurred this year', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 30, today.getMonth() + 1, today.getDate());
      expect(calculateAge(birthDate)).toBe(29);
    });
  });

  describe('Step 1: Basic Information', () => {
    it('should accept valid basic info', async () => {
      const validData = {
        fullName: 'John Smith',
        gender: 'MALE',
        dateOfBirth: new Date(1998, 0, 15),
        nationality: 'American',
        country: 'United States',
        city: 'New York',
        ethnicity: 'European',
      };

      const result = await validateOnboardingStep(1, validData, 'MALE');
      expect(result.valid).toBe(true);
    });

    it('should reject if age is less than 14', async () => {
      const invalidData = {
        fullName: 'Young Person',
        gender: 'MALE',
        dateOfBirth: new Date(new Date().getFullYear() - 10, 0, 15),
        nationality: 'American',
        country: 'United States',
      };

      const result = await validateOnboardingStep(1, invalidData, 'MALE');
      expect(result.valid).toBe(false);
      expect(result.errors.dateOfBirth).toBeDefined();
    });

    it('should reject if name contains contact info', async () => {
      const invalidData = {
        fullName: 'John@email.com',
        gender: 'MALE',
        dateOfBirth: new Date(1998, 0, 15),
        nationality: 'American',
        country: 'United States',
      };

      const result = await validateOnboardingStep(1, invalidData, 'MALE');
      expect(result.valid).toBe(false);
      expect(result.errors.fullName).toBeDefined();
    });

    it('should require nationality and country', async () => {
      const invalidData = {
        fullName: 'John Smith',
        gender: 'MALE',
        dateOfBirth: new Date(1998, 0, 15),
        nationality: '',
        country: '',
      };

      const result = OnboardingStep1Schema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Step 3: Marital Status', () => {
    it('should accept virgin status for females', async () => {
      const validData = {
        maritalStatus: 'virgin',
        numberOfChildren: 0,
        willingToRelocate: 'yes',
      };

      const result = await validateOnboardingStep(3, validData, 'FEMALE');
      expect(result.valid).toBe(true);
    });

    it('should accept divorced status for females', async () => {
      const validData = {
        maritalStatus: 'divorced',
        numberOfChildren: 1,
        childrenLivingWithMe: 1,
        willingToRelocate: 'maybe',
      };

      const result = await validateOnboardingStep(3, validData, 'FEMALE');
      expect(result.valid).toBe(true);
    });

    it('should accept annulled status for females', async () => {
      const validData = {
        maritalStatus: 'annulled',
        numberOfChildren: 0,
        willingToRelocate: 'no',
      };

      const result = await validateOnboardingStep(3, validData, 'FEMALE');
      expect(result.valid).toBe(true);
    });

    it('should REJECT married status for females with specific error', async () => {
      const invalidData = {
        maritalStatus: 'married',
        numberOfChildren: 0,
        willingToRelocate: 'yes',
      };

      const result = await validateOnboardingStep(3, invalidData, 'FEMALE');
      expect(result.valid).toBe(false);
      expect(result.errors.maritalStatus).toContain('AlHarmony is for single sisters');
    });

    it('should accept married status for males', async () => {
      const validData = {
        maritalStatus: 'married',
        numberOfChildren: 2,
        childrenLivingWithMe: 1,
        willingToRelocate: 'maybe',
      };

      const result = await validateOnboardingStep(3, validData, 'MALE');
      expect(result.valid).toBe(true);
    });

    it('should accept virgin and separated for males', async () => {
      const validData1 = {
        maritalStatus: 'virgin',
        numberOfChildren: 0,
        willingToRelocate: 'yes',
      };

      const validData2 = {
        maritalStatus: 'separated',
        numberOfChildren: 1,
        childrenLivingWithMe: 0,
        willingToRelocate: 'no',
      };

      const result1 = await validateOnboardingStep(3, validData1, 'MALE');
      const result2 = await validateOnboardingStep(3, validData2, 'MALE');

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
    });
  });

  describe('Step 5: Wali Information (Female)', () => {
    it('should accept valid wali information', async () => {
      const validData = {
        waliName: 'Ahmed Smith',
        waliRelationship: 'Father',
        waliEmail: 'ahmed@example.com',
        waliPhone: '+1-555-0123',
      };

      const result = await validateOnboardingStep(5, validData, 'FEMALE');
      expect(result.valid).toBe(true);
    });

    it('should require all wali fields for females', async () => {
      const invalidData = {
        waliName: 'Ahmed Smith',
        waliRelationship: 'Father',
        waliEmail: '',
        waliPhone: '',
      };

      const result = OnboardingStep5FemaleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate email format', async () => {
      const invalidData = {
        waliName: 'Ahmed Smith',
        waliRelationship: 'Father',
        waliEmail: 'invalid-email',
        waliPhone: '+1-555-0123',
      };

      const result = OnboardingStep5FemaleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept various wali relationships', async () => {
      const relationships = ['Father', 'Brother', 'Uncle', 'Grandfather', 'Imam', 'Other'];

      for (const rel of relationships) {
        const data = {
          waliName: 'Family Member',
          waliRelationship: rel,
          waliEmail: 'family@example.com',
          waliPhone: '+1-555-0123',
        };

        const result = OnboardingStep5FemaleSchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Gender-specific validation helpers', () => {
    describe('isValidMaritalStatus', () => {
      it('should validate female marital statuses', () => {
        expect(isValidMaritalStatus('FEMALE', 'virgin')).toBe(true);
        expect(isValidMaritalStatus('FEMALE', 'divorced')).toBe(true);
        expect(isValidMaritalStatus('FEMALE', 'annulled')).toBe(true);
        expect(isValidMaritalStatus('FEMALE', 'married')).toBe(false);
        expect(isValidMaritalStatus('FEMALE', 'separated')).toBe(false);
      });

      it('should validate male marital statuses', () => {
        expect(isValidMaritalStatus('MALE', 'virgin')).toBe(true);
        expect(isValidMaritalStatus('MALE', 'married')).toBe(true);
        expect(isValidMaritalStatus('MALE', 'separated')).toBe(true);
        expect(isValidMaritalStatus('MALE', 'divorced')).toBe(false);
        expect(isValidMaritalStatus('MALE', 'annulled')).toBe(false);
      });

      it('should be case-insensitive', () => {
        expect(isValidMaritalStatus('FEMALE', 'VIRGIN')).toBe(true);
        expect(isValidMaritalStatus('MALE', 'MARRIED')).toBe(true);
      });
    });

    describe('isValidSpousePreference', () => {
      it('should validate female spouse preferences', () => {
        // Females select male marital statuses (what they seek in a spouse)
        expect(isValidSpousePreference('FEMALE', 'virgin')).toBe(true);
        expect(isValidSpousePreference('FEMALE', 'married')).toBe(true);
        expect(isValidSpousePreference('FEMALE', 'separated')).toBe(true);
        expect(isValidSpousePreference('FEMALE', 'divorced')).toBe(false);
      });

      it('should validate male spouse preferences', () => {
        // Males select female marital statuses (what they seek in a spouse)
        expect(isValidSpousePreference('MALE', 'virgin')).toBe(true);
        expect(isValidSpousePreference('MALE', 'divorced')).toBe(true);
        expect(isValidSpousePreference('MALE', 'annulled')).toBe(true);
        expect(isValidSpousePreference('MALE', 'married')).toBe(false);
      });
    });
  });
});

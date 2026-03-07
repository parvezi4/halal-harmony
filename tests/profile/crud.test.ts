/**
 * Profile CRUD Tests
 * Tests profile read and update operations with database integration
 */

import { prisma } from '@/lib/prisma';

describe('Profile CRUD Operations', () => {
  let testUserId: string;
  let testProfileId: string;

  // Create test user and profile before all tests
  beforeAll(async () => {
    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        email: 'profile-crud-test@example.com',
        passwordHash: 'hashed_password_here',
      },
    });
    testUserId = testUser.id;

    // Create a test profile with all mandatory fields
    const testProfile = await prisma.profile.create({
      data: {
        userId: testUserId,
        gender: 'FEMALE',
        fullName: 'Test User Female',
        dateOfBirth: new Date('1995-05-15'),
        nationality: 'American',
        country: 'United States',
        practicingLevel: 'Practicing',
        prayerHabit: '5 times daily',
        height: '165cm',
        bodyShape: 'Average',
        hijabOrBeard: 'Hijab',
        madhhabOrManhaj: 'Hanafi',
        maritalStatus: 'Virgin',
        numberOfChildren: 0,
        willingToRelocate: 'maybe',
        spouseStatusPreferences: JSON.stringify(['virgin', 'divorced']),
        waliName: 'Father Name',
        waliRelationship: 'Father',
        waliEmail: 'father@example.com',
        waliPhone: '+1234567890',
        onboardingCompletedAt: new Date(),
      },
    });
    testProfileId = testProfile.id;
  });

  // Clean up after all tests
  afterAll(async () => {
    await prisma.profile.delete({ where: { id: testProfileId } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  describe('Read Profile', () => {
    it('should fetch complete profile data', async () => {
      const profile = await prisma.profile.findUnique({
        where: { userId: testUserId },
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      expect(profile).not.toBeNull();
      expect(profile?.userId).toBe(testUserId);
      expect(profile?.fullName).toBe('Test User Female');
      expect(profile?.gender).toBe('FEMALE');
      expect(profile?.user.email).toBe('profile-crud-test@example.com');
    });

    it('should return all profile fields', async () => {
      const profile = await prisma.profile.findUnique({
        where: { userId: testUserId },
      });

      expect(profile).toBeDefined();
      expect(profile?.fullName).toBeDefined();
      expect(profile?.dateOfBirth).toBeDefined();
      expect(profile?.nationality).toBeDefined();
      expect(profile?.country).toBeDefined();
      expect(profile?.practicingLevel).toBeDefined();
      expect(profile?.prayerHabit).toBeDefined();
      expect(profile?.height).toBeDefined();
      expect(profile?.bodyShape).toBeDefined();
      expect(profile?.hijabOrBeard).toBeDefined();
      expect(profile?.madhhabOrManhaj).toBeDefined();
      expect(profile?.maritalStatus).toBeDefined();
      expect(profile?.willingToRelocate).toBeDefined();
      expect(profile?.spouseStatusPreferences).toBeDefined();
    });

    it('should parse spouseStatusPreferences JSON', async () => {
      const profile = await prisma.profile.findUnique({
        where: { userId: testUserId },
      });

      expect(profile?.spouseStatusPreferences).toBeDefined();
      const preferences = JSON.parse(profile?.spouseStatusPreferences || '[]');
      expect(Array.isArray(preferences)).toBe(true);
      expect(preferences).toContain('virgin');
      expect(preferences).toContain('divorced');
    });
  });

  describe('Update Profile', () => {
    it('should update profile with valid data', async () => {
      const updatedData = {
        fullName: 'Updated Test Name',
        city: 'New York',
        about: 'Updated about section',
        education: 'BSc Computer Science',
        profession: 'Software Engineer',
      };

      const updatedProfile = await prisma.profile.update({
        where: { userId: testUserId },
        data: updatedData,
      });

      expect(updatedProfile.fullName).toBe('Updated Test Name');
      expect(updatedProfile.city).toBe('New York');
      expect(updatedProfile.about).toBe('Updated about section');
      expect(updatedProfile.education).toBe('BSc Computer Science');
      expect(updatedProfile.profession).toBe('Software Engineer');
    });

    it('should update optional fields to null', async () => {
      await prisma.profile.update({
        where: { userId: testUserId },
        data: {
          city: 'Test City',
          ethnicity: 'Asian',
          weight: 65,
        },
      });

      // Verify fields were set
      let profile = await prisma.profile.findUnique({
        where: { userId: testUserId },
      });
      expect(profile?.city).toBe('Test City');
      expect(profile?.ethnicity).toBe('Asian');
      expect(profile?.weight).toBe(65);

      // Update to null
      const updatedProfile = await prisma.profile.update({
        where: { userId: testUserId },
        data: {
          city: null,
          ethnicity: null,
          weight: null,
        },
      });

      expect(updatedProfile.city).toBeNull();
      expect(updatedProfile.ethnicity).toBeNull();
      expect(updatedProfile.weight).toBeNull();
    });

    it('should update all mandatory fields successfully', async () => {
      const mandatoryUpdate = {
        fullName: 'Another Name',
        dateOfBirth: new Date('1990-01-01'),
        nationality: 'British',
        country: 'United Kingdom',
        practicingLevel: 'Very practicing',
        prayerHabit: 'Regularly',
        height: '170cm',
        bodyShape: 'Athletic',
        hijabOrBeard: 'Niqab',
        madhhabOrManhaj: 'Maliki',
        maritalStatus: 'Divorced',
        numberOfChildren: 1,
        willingToRelocate: 'yes',
        spouseStatusPreferences: JSON.stringify(['virgin']),
      };

      const updated = await prisma.profile.update({
        where: { userId: testUserId },
        data: mandatoryUpdate,
      });

      expect(updated.fullName).toBe('Another Name');
      expect(updated.nationality).toBe('British');
      expect(updated.practicingLevel).toBe('Very practicing');
      expect(updated.maritalStatus).toBe('Divorced');
      expect(updated.numberOfChildren).toBe(1);
    });

    it('should handle spouse preferences array correctly', async () => {
      const newPreferences = ['virgin', 'divorced', 'annulled'];

      await prisma.profile.update({
        where: { userId: testUserId },
        data: {
          spouseStatusPreferences: JSON.stringify(newPreferences),
        },
      });

      const profile = await prisma.profile.findUnique({
        where: { userId: testUserId },
      });

      const parsedPrefs = JSON.parse(profile?.spouseStatusPreferences || '[]');
      expect(parsedPrefs).toEqual(newPreferences);
      expect(parsedPrefs.length).toBe(3);
    });
  });

  describe('Gender-Specific Validation', () => {
    let maleUserId: string;
    let maleProfileId: string;

    beforeAll(async () => {
      // Create male test user and profile
      const maleUser = await prisma.user.create({
        data: {
          email: 'male-profile-test@example.com',
          passwordHash: 'hashed_password',
        },
      });
      maleUserId = maleUser.id;

      const maleProfile = await prisma.profile.create({
        data: {
          userId: maleUserId,
          gender: 'MALE',
          fullName: 'Test Male User',
          dateOfBirth: new Date('1990-01-01'),
          nationality: 'Canadian',
          country: 'Canada',
          practicingLevel: 'Practicing',
          prayerHabit: '5 times daily',
          height: '180cm',
          bodyShape: 'Athletic',
          hijabOrBeard: 'Full beard',
          madhhabOrManhaj: 'Hanafi',
          maritalStatus: 'Virgin',
          numberOfChildren: 0,
          willingToRelocate: 'no',
          spouseStatusPreferences: JSON.stringify(['virgin']),
          // No wali fields for males
        },
      });
      maleProfileId = maleProfile.id;
    });

    afterAll(async () => {
      await prisma.profile.delete({ where: { id: maleProfileId } });
      await prisma.user.delete({ where: { id: maleUserId } });
    });

    it('should have wali fields for female profile', async () => {
      const femaleProfile = await prisma.profile.findUnique({
        where: { userId: testUserId },
      });

      expect(femaleProfile?.gender).toBe('FEMALE');
      expect(femaleProfile?.waliName).toBeDefined();
      expect(femaleProfile?.waliEmail).toBeDefined();
      expect(femaleProfile?.waliRelationship).toBeDefined();
      expect(femaleProfile?.waliPhone).toBeDefined();
    });

    it('should allow null wali fields for male profile', async () => {
      const maleProfile = await prisma.profile.findUnique({
        where: { userId: maleUserId },
      });

      expect(maleProfile?.gender).toBe('MALE');
      expect(maleProfile?.waliName).toBeNull();
      expect(maleProfile?.waliEmail).toBeNull();
      expect(maleProfile?.waliRelationship).toBeNull();
      expect(maleProfile?.waliPhone).toBeNull();
    });

    it('should allow updating male profile without wali fields', async () => {
      const updated = await prisma.profile.update({
        where: { userId: maleUserId },
        data: {
          fullName: 'Updated Male Name',
          about: 'New about section',
          // No wali fields
        },
      });

      expect(updated.fullName).toBe('Updated Male Name');
      expect(updated.waliName).toBeNull();
    });

    it('should allow updating female profile wali info', async () => {
      const updated = await prisma.profile.update({
        where: { userId: testUserId },
        data: {
          waliName: 'Updated Wali Name',
          waliEmail: 'updated_wali@example.com',
          waliPhone: '+9876543210',
        },
      });

      expect(updated.waliName).toBe('Updated Wali Name');
      expect(updated.waliEmail).toBe('updated_wali@example.com');
      expect(updated.waliPhone).toBe('+9876543210');
    });
  });

  describe('Field Constraints', () => {
    it('should allow numberOfChildren of 0 or greater', async () => {
      // Set to 0
      let updated = await prisma.profile.update({
        where: { userId: testUserId },
        data: { numberOfChildren: 0 },
      });
      expect(updated.numberOfChildren).toBe(0);

      // Set to positive number
      updated = await prisma.profile.update({
        where: { userId: testUserId },
        data: { numberOfChildren: 3 },
      });
      expect(updated.numberOfChildren).toBe(3);
    });

    it('should allow weight in valid range', async () => {
      const updated = await prisma.profile.update({
        where: { userId: testUserId },
        data: { weight: 70 },
      });

      expect(updated.weight).toBe(70);
    });
  });

  describe('Timestamp Tracking', () => {
    it('should update updatedAt timestamp on profile update', async () => {
      const beforeUpdate = await prisma.profile.findUnique({
        where: { userId: testUserId },
      });

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => global.setTimeout(resolve, 100));

      await prisma.profile.update({
        where: { userId: testUserId },
        data: { about: 'Timestamp test' },
      });

      const afterUpdate = await prisma.profile.findUnique({
        where: { userId: testUserId },
      });

      expect(afterUpdate?.updatedAt.getTime()).toBeGreaterThan(
        beforeUpdate?.updatedAt.getTime() || 0
      );
    });

    it('should preserve onboardingCompletedAt on updates', async () => {
      const original = await prisma.profile.findUnique({
        where: { userId: testUserId },
      });

      const originalCompletedAt = original?.onboardingCompletedAt;

      await prisma.profile.update({
        where: { userId: testUserId },
        data: { education: 'Masters Degree' },
      });

      const updated = await prisma.profile.findUnique({
        where: { userId: testUserId },
      });

      expect(updated?.onboardingCompletedAt).toEqual(originalCompletedAt);
    });
  });
});

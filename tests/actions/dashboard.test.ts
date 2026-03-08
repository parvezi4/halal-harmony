import { calculateProfileCompleteness } from '@/lib/profile/completeness';

describe('calculateProfileCompleteness', () => {
  it('should not return 100% when familyBackground is blank', () => {
    const result = calculateProfileCompleteness({
      gender: 'MALE',
      alias: 'Ahmed',
      dateOfBirth: new Date('1990-01-01'),
      country: 'UK',
      city: 'London',
      practicingLevel: 'Practicing',
      prayerHabit: '5 times daily',
      bodyShape: 'Average',
      hijabOrBeard: 'Trimmed beard',
      maritalStatus: 'MARRIED',
      numberOfChildren: 2,
      spouseStatusPreferences: '["VIRGIN","DIVORCED"]',
      about: 'About me',
      education: 'BSc',
      profession: 'Engineer',
      madhhabOrManhaj: 'Hanafi',
      photos: [{ id: 'photo-1', isPrimary: true }],
      familyBackground: '',
    });

    expect(result.optional.total).toBe(6);
    expect(result.optional.completed).toBe(5);
    expect(result.percentage).toBeLessThan(100);
  });

  it('should return 100% when all tracked fields are filled', () => {
    const result = calculateProfileCompleteness({
      gender: 'MALE',
      alias: 'Ahmed',
      dateOfBirth: new Date('1990-01-01'),
      country: 'UK',
      city: 'London',
      practicingLevel: 'Practicing',
      prayerHabit: '5 times daily',
      bodyShape: 'Average',
      hijabOrBeard: 'Trimmed beard',
      maritalStatus: 'MARRIED',
      numberOfChildren: 2,
      spouseStatusPreferences: '["VIRGIN","DIVORCED"]',
      about: 'About me',
      education: 'BSc',
      profession: 'Engineer',
      madhhabOrManhaj: 'Hanafi',
      photos: [{ id: 'photo-1', isPrimary: true }],
      familyBackground: 'Supportive family background',
    });

    expect(result.percentage).toBe(100);
  });
});

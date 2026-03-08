export type CompletenessInput = {
  gender?: string | null;
  alias?: string | null;
  fullName?: string | null;
  dateOfBirth?: Date | null;
  country?: string | null;
  city?: string | null;
  practicingLevel?: string | null;
  prayerHabit?: string | null;
  height?: string | null;
  bodyShape?: string | null;
  hijabOrBeard?: string | null;
  madhhabOrManhaj?: string | null;
  maritalStatus?: string | null;
  numberOfChildren?: number | null;
  spouseStatusPreferences?: string | null;
  waliName?: string | null;
  waliRelationship?: string | null;
  waliEmail?: string | null;
  waliPhone?: string | null;
  about?: string | null;
  familyBackground?: string | null;
  education?: string | null;
  profession?: string | null;
  photos?: { id: string; isPrimary: boolean }[];
};

export function calculateProfileCompleteness(profile: CompletenessInput) {
  let mandatoryCompleted = 0;
  let mandatoryTotal = 0;
  let optionalCompleted = 0;
  let optionalTotal = 0;

  mandatoryTotal += 1;
  if (profile.alias && profile.alias.trim()) {
    mandatoryCompleted += 1;
  }

  mandatoryTotal += 1;
  if (profile.gender) {
    mandatoryCompleted += 1;
  }

  mandatoryTotal += 1;
  if ((profile.city && profile.city.trim()) || (profile.country && profile.country.trim())) {
    mandatoryCompleted += 1;
  }

  mandatoryTotal += 1;
  if (profile.dateOfBirth) {
    mandatoryCompleted += 1;
  }

  mandatoryTotal += 1;
  if (profile.practicingLevel && profile.practicingLevel.trim()) {
    mandatoryCompleted += 1;
  }

  mandatoryTotal += 1;
  if (profile.prayerHabit && profile.prayerHabit.trim()) {
    mandatoryCompleted += 1;
  }

  mandatoryTotal += 1;
  if (profile.bodyShape && profile.bodyShape.trim()) {
    mandatoryCompleted += 1;
  }

  mandatoryTotal += 1;
  if (profile.hijabOrBeard && profile.hijabOrBeard.trim()) {
    mandatoryCompleted += 1;
  }

  mandatoryTotal += 1;
  if (profile.maritalStatus && profile.maritalStatus.trim()) {
    mandatoryCompleted += 1;
  }

  mandatoryTotal += 1;
  if (profile.numberOfChildren !== null && profile.numberOfChildren !== undefined) {
    mandatoryCompleted += 1;
  }

  mandatoryTotal += 1;
  if (profile.spouseStatusPreferences && profile.spouseStatusPreferences !== '[]') {
    mandatoryCompleted += 1;
  }

  if (profile.gender === 'FEMALE') {
    mandatoryTotal += 3;
    if (profile.waliName && profile.waliName.trim()) {
      mandatoryCompleted += 1;
    }
    if (profile.waliRelationship && profile.waliRelationship.trim()) {
      mandatoryCompleted += 1;
    }
    if ((profile.waliEmail && profile.waliEmail.trim()) || (profile.waliPhone && profile.waliPhone.trim())) {
      mandatoryCompleted += 1;
    }
  }

  optionalTotal += 2;
  if (profile.photos && profile.photos.length > 0) {
    optionalCompleted += 1;
  }
  if (profile.about && profile.about.trim()) {
    optionalCompleted += 1;
  }

  optionalTotal += 1;
  if (profile.education && profile.education.trim()) {
    optionalCompleted += 1;
  }

  optionalTotal += 1;
  if (profile.profession && profile.profession.trim()) {
    optionalCompleted += 1;
  }

  optionalTotal += 1;
  if (profile.familyBackground && profile.familyBackground.trim()) {
    optionalCompleted += 1;
  }

  optionalTotal += 1;
  if (profile.madhhabOrManhaj && profile.madhhabOrManhaj.trim()) {
    optionalCompleted += 1;
  }

  const totalFields = mandatoryTotal + optionalTotal;
  const completedFields = mandatoryCompleted + optionalCompleted;
  const percentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

  return {
    percentage,
    completedFields,
    totalFields,
    mandatory: {
      completed: mandatoryCompleted,
      total: mandatoryTotal,
    },
    optional: {
      completed: optionalCompleted,
      total: optionalTotal,
    },
  };
}
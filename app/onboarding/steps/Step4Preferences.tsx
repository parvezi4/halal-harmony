'use client';

import { FormEvent, useState } from 'react';
import type { OnboardingStep4FormData } from '@/lib/validators/onboarding';

interface Step4PreferencesProps {
  onData: (data: OnboardingStep4FormData) => void;
  onSaveAndContinue: (data: OnboardingStep4FormData) => void;
  loading: boolean;
  gender: 'MALE' | 'FEMALE';
  fieldErrors: Record<string, string>;
  initialData?: Partial<OnboardingStep4FormData>;
}

// Marital statuses that females can have (what males can seek)
const FEMALE_MARITAL_STATUSES = ['virgin', 'divorced', 'annulled'];

// Marital statuses that males can have (what females can seek)
const MALE_MARITAL_STATUSES = ['virgin', 'married', 'separated'];

const PREFERENCE_LABELS: Record<string, string> = {
  virgin: 'Virgin',
  married: 'Married (Second wife)',
  separated: 'Separated',
  divorced: 'Divorced',
  annulled: 'Annulled',
};

export default function Step4Preferences({
  onData,
  onSaveAndContinue,
  loading,
  gender,
  fieldErrors,
  initialData,
}: Step4PreferencesProps) {
  const [formData, setFormData] = useState<OnboardingStep4FormData>({
    spouseStatusPreferences: initialData?.spouseStatusPreferences || [],
  });

  // Female users select male statuses they're seeking, and vice versa
  const preferences = gender === 'FEMALE' ? MALE_MARITAL_STATUSES : FEMALE_MARITAL_STATUSES;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSaveAndContinue(formData);
  };

  const handleTogglePreference = (pref: string) => {
    const updatedPreferences = formData.spouseStatusPreferences.includes(pref)
      ? formData.spouseStatusPreferences.filter((p) => p !== pref)
      : [...formData.spouseStatusPreferences, pref];
    const updatedFormData = { spouseStatusPreferences: updatedPreferences };
    setFormData(updatedFormData);
    onData(updatedFormData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 rounded-lg p-6 md:p-8">
      <h2 className="text-xl md:text-2xl font-bold mb-6">Step 4: What Are You Seeking?</h2>

      <p className="text-gray-300 mb-6">
        Select the marital status or experience you&apos;re open to in a spouse:
      </p>

      <div className="space-y-3">
        {preferences.map((pref) => (
          <label
            key={pref}
            className="flex items-center gap-4 p-4 bg-gray-700 border-2 border-gray-600 rounded-lg cursor-pointer hover:border-green-500 transition-colors"
          >
            <input
              type="checkbox"
              value={pref}
              checked={formData.spouseStatusPreferences.includes(pref)}
              onChange={() => handleTogglePreference(pref)}
              disabled={loading}
              className="w-5 h-5 cursor-pointer"
            />
            <span className="text-lg font-medium">{PREFERENCE_LABELS[pref]}</span>
          </label>
        ))}
      </div>

      {fieldErrors.spouseStatusPreferences && (
        <div className="p-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg">
          <p className="text-red-200">{fieldErrors.spouseStatusPreferences}</p>
        </div>
      )}

      <div className="p-4 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg">
        <p className="text-blue-200 text-sm">
          💡 Tip: You can change these preferences later on your profile after onboarding.
        </p>
      </div>
    </form>
  );
}

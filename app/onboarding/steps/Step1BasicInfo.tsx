'use client';

import { FormEvent, useState } from 'react';
import type { OnboardingStep1FormData } from '@/lib/validators/onboarding';

interface Step1BasicInfoProps {
  // eslint-disable-next-line no-unused-vars
  onData: (_data: OnboardingStep1FormData) => void;
  // eslint-disable-next-line no-unused-vars
  onSaveAndContinue: (_data: OnboardingStep1FormData) => void;
  loading: boolean;
  fieldErrors: Record<string, string>;
  initialData?: Partial<OnboardingStep1FormData>;
}

const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  'Saudi Arabia',
  'UAE',
  'Pakistan',
  'India',
  'Malaysia',
  'Indonesia',
  'Egypt',
  'Morocco',
  'Turkey',
  'Other',
];

const NATIONALITIES = [
  'American',
  'British',
  'Canadian',
  'Australian',
  'German',
  'French',
  'Saudi',
  'Emirati',
  'Pakistani',
  'Indian',
  'Malaysian',
  'Indonesian',
  'Egyptian',
  'Moroccan',
  'Turkish',
  'Other',
];

const ETHNICITIES = [
  'Arab',
  'Asian',
  'African',
  'European',
  'South Asian',
  'Southeast Asian',
  'Middle Eastern',
  'Mixed',
  'Other',
];

export default function Step1BasicInfo({
  onData,
  onSaveAndContinue,
  loading,
  fieldErrors,
  initialData,
}: Step1BasicInfoProps) {
  const [formData, setFormData] = useState<OnboardingStep1FormData>({
    fullName: initialData?.fullName || '',
    gender: initialData?.gender || 'MALE',
    dateOfBirth: initialData?.dateOfBirth ? new Date(initialData.dateOfBirth) : new Date(),
    nationality: initialData?.nationality || '',
    country: initialData?.country || '',
    city: initialData?.city || '',
    ethnicity: initialData?.ethnicity || '',
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSaveAndContinue(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let updatedFormData;
    if (name === 'dateOfBirth') {
      updatedFormData = {
        ...formData,
        [name]: new Date(value),
      };
    } else {
      updatedFormData = {
        ...formData,
        [name]: value,
      };
    }
    setFormData(updatedFormData);
    onData(updatedFormData);
  };

  // Calculate max date (user must be 14+)
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate());
  const maxDateString = maxDate.toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 rounded-lg p-6 md:p-8">
      <h2 className="text-xl md:text-2xl font-bold mb-6">Step 1: Basic Information</h2>

      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium mb-2">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Enter your full name"
          className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 ${
            fieldErrors.fullName ? 'border-red-500' : 'border-gray-600'
          }`}
          disabled={loading}
        />
        {fieldErrors.fullName && (
          <p className="text-red-400 text-sm mt-1">{fieldErrors.fullName}</p>
        )}
        <p className="text-gray-400 text-xs mt-1">Avoid including contact information</p>
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-medium mb-3">
          Gender <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="gender"
              value="MALE"
              checked={formData.gender === 'MALE'}
              onChange={handleChange}
              className="w-4 h-4"
              disabled={loading}
            />
            <span>Male</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="gender"
              value="FEMALE"
              checked={formData.gender === 'FEMALE'}
              onChange={handleChange}
              className="w-4 h-4"
              disabled={loading}
            />
            <span>Female</span>
          </label>
        </div>
        {fieldErrors.gender && <p className="text-red-400 text-sm mt-2">{fieldErrors.gender}</p>}
      </div>

      {/* Date of Birth */}
      <div>
        <label htmlFor="dateOfBirth" className="block text-sm font-medium mb-2">
          Date of Birth <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="dateOfBirth"
          name="dateOfBirth"
          value={formData.dateOfBirth?.toISOString().split('T')[0] || ''}
          onChange={handleChange}
          max={maxDateString}
          className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:border-green-500 ${
            fieldErrors.dateOfBirth ? 'border-red-500' : 'border-gray-600'
          }`}
          disabled={loading}
        />
        {fieldErrors.dateOfBirth && (
          <p className="text-red-400 text-sm mt-1">{fieldErrors.dateOfBirth}</p>
        )}
        <p className="text-gray-400 text-xs mt-1">You must be at least 14 years old</p>
      </div>

      {/* Nationality */}
      <div>
        <label htmlFor="nationality" className="block text-sm font-medium mb-2">
          Nationality <span className="text-red-500">*</span>
        </label>
        <select
          id="nationality"
          name="nationality"
          value={formData.nationality}
          onChange={handleChange}
          className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:border-green-500 ${
            fieldErrors.nationality ? 'border-red-500' : 'border-gray-600'
          }`}
          disabled={loading}
        >
          <option value="">Select nationality</option>
          {NATIONALITIES.map((nat) => (
            <option key={nat} value={nat}>
              {nat}
            </option>
          ))}
        </select>
        {fieldErrors.nationality && (
          <p className="text-red-400 text-sm mt-1">{fieldErrors.nationality}</p>
        )}
      </div>

      {/* Country */}
      <div>
        <label htmlFor="country" className="block text-sm font-medium mb-2">
          Current Country <span className="text-red-500">*</span>
        </label>
        <select
          id="country"
          name="country"
          value={formData.country}
          onChange={handleChange}
          className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:border-green-500 ${
            fieldErrors.country ? 'border-red-500' : 'border-gray-600'
          }`}
          disabled={loading}
        >
          <option value="">Select country</option>
          {COUNTRIES.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
        {fieldErrors.country && <p className="text-red-400 text-sm mt-1">{fieldErrors.country}</p>}
      </div>

      {/* City */}
      <div>
        <label htmlFor="city" className="block text-sm font-medium mb-2">
          City / Region
        </label>
        <input
          type="text"
          id="city"
          name="city"
          value={formData.city || ''}
          onChange={handleChange}
          placeholder="Enter your city"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
          disabled={loading}
        />
      </div>

      {/* Ethnicity */}
      <div>
        <label htmlFor="ethnicity" className="block text-sm font-medium mb-2">
          Ethnicity
        </label>
        <select
          id="ethnicity"
          name="ethnicity"
          value={formData.ethnicity || ''}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
          disabled={loading}
        >
          <option value="">Select ethnicity</option>
          {ETHNICITIES.map((ethn) => (
            <option key={ethn} value={ethn}>
              {ethn}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
}

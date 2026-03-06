'use client';

import { FormEvent, useState } from 'react';
import type { OnboardingStep2FormData } from '@/lib/validators/onboarding';

interface Step2IslamicInfoProps {
  onData: (data: OnboardingStep2FormData) => void;
  onSaveAndContinue: (data: OnboardingStep2FormData) => void;
  loading: boolean;
  gender: 'MALE' | 'FEMALE';
  fieldErrors: Record<string, string>;
  initialData?: Partial<OnboardingStep2FormData>;
}

const PRACTICING_LEVELS = [
  'Very practicing',
  'Practicing',
  'Moderate',
  'Less practicing',
  'Secular',
];
const PRAYER_FREQUENCIES = ['5 times daily', 'Regularly', 'Sometimes', 'Rarely', 'Never'];
const BODY_SHAPES = ['Athletic', 'Average', 'Curvy', 'Muscular', 'Plus-size'];
const HEIGHTS = Array.from({ length: 121 }, (_, i) => `${140 + i}cm`);
const MADHABS = ['Hanafi', 'Maliki', "Shafi'i", 'Hanbali'];
const HIJAB_STYLES = ['Niqab', 'Hijab', 'Headscarf', 'No preference'];
const BEARD_STYLES = ['Full beard', 'Trimmed', 'Clean shaven'];

export default function Step2IslamicInfo({
  onData,
  onSaveAndContinue,
  loading,
  gender,
  fieldErrors,
  initialData,
}: Step2IslamicInfoProps) {
  const [formData, setFormData] = useState({
    practicingLevel: initialData?.practicingLevel || '',
    prayerHabit: initialData?.prayerHabit || '',
    height: initialData?.height || '',
    bodyShape: initialData?.bodyShape || '',
    weight: initialData?.weight ? String(initialData.weight) : '',
    hijabOrBeard: initialData?.hijabOrBeard || '',
    madhhabOrManhaj: initialData?.madhhabOrManhaj || '',
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSaveAndContinue({
      practicingLevel: formData.practicingLevel as OnboardingStep2FormData['practicingLevel'],
      prayerHabit: formData.prayerHabit as OnboardingStep2FormData['prayerHabit'],
      height: formData.height,
      bodyShape: formData.bodyShape as OnboardingStep2FormData['bodyShape'],
      weight: formData.weight ? Number(formData.weight) : null,
      hijabOrBeard: formData.hijabOrBeard,
      madhhabOrManhaj: formData.madhhabOrManhaj,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: value,
    };
    setFormData(updatedFormData);
    onData({
      practicingLevel:
        updatedFormData.practicingLevel as OnboardingStep2FormData['practicingLevel'],
      prayerHabit: updatedFormData.prayerHabit as OnboardingStep2FormData['prayerHabit'],
      height: updatedFormData.height,
      bodyShape: updatedFormData.bodyShape as OnboardingStep2FormData['bodyShape'],
      weight: updatedFormData.weight ? Number(updatedFormData.weight) : null,
      hijabOrBeard: updatedFormData.hijabOrBeard,
      madhhabOrManhaj: updatedFormData.madhhabOrManhaj,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 rounded-lg p-6 md:p-8">
      <h2 className="text-xl md:text-2xl font-bold mb-6">Step 2: Islamic Background & Details</h2>

      {/* Practicing Level */}
      <div>
        <label className="block text-sm font-medium mb-3">
          Practicing Level <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {PRACTICING_LEVELS.map((level) => (
            <label key={level} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="practicingLevel"
                value={level}
                checked={formData.practicingLevel === level}
                onChange={handleChange}
                disabled={loading}
              />
              <span>{level}</span>
            </label>
          ))}
        </div>
        {fieldErrors.practicingLevel && (
          <p className="text-red-400 text-sm mt-2">{fieldErrors.practicingLevel}</p>
        )}
      </div>

      {/* Prayer Frequency */}
      <div>
        <label className="block text-sm font-medium mb-3">
          Prayer Frequency <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {PRAYER_FREQUENCIES.map((freq) => (
            <label key={freq} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="prayerHabit"
                value={freq}
                checked={formData.prayerHabit === freq}
                onChange={handleChange}
                disabled={loading}
              />
              <span>{freq}</span>
            </label>
          ))}
        </div>
        {fieldErrors.prayerHabit && (
          <p className="text-red-400 text-sm mt-2">{fieldErrors.prayerHabit}</p>
        )}
      </div>

      {/* Height */}
      <div>
        <label htmlFor="height" className="block text-sm font-medium mb-2">
          Height <span className="text-red-500">*</span>
        </label>
        <select
          id="height"
          name="height"
          value={formData.height}
          onChange={handleChange}
          className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:border-green-500 ${
            fieldErrors.height ? 'border-red-500' : 'border-gray-600'
          }`}
          disabled={loading}
        >
          <option value="">Select height</option>
          {HEIGHTS.map((height) => (
            <option key={height} value={height}>
              {height}
            </option>
          ))}
        </select>
        {fieldErrors.height && <p className="text-red-400 text-sm mt-1">{fieldErrors.height}</p>}
      </div>

      {/* Body Shape */}
      <div>
        <label htmlFor="bodyShape" className="block text-sm font-medium mb-2">
          Body Shape <span className="text-red-500">*</span>
        </label>
        <select
          id="bodyShape"
          name="bodyShape"
          value={formData.bodyShape}
          onChange={handleChange}
          className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:border-green-500 ${
            fieldErrors.bodyShape ? 'border-red-500' : 'border-gray-600'
          }`}
          disabled={loading}
        >
          <option value="">Select body shape</option>
          {BODY_SHAPES.map((shape) => (
            <option key={shape} value={shape}>
              {shape}
            </option>
          ))}
        </select>
        {fieldErrors.bodyShape && (
          <p className="text-red-400 text-sm mt-1">{fieldErrors.bodyShape}</p>
        )}
      </div>

      {/* Weight */}
      <div>
        <label htmlFor="weight" className="block text-sm font-medium mb-2">
          Weight (kg) <span className="text-gray-400">(optional)</span>
        </label>
        <input
          type="number"
          id="weight"
          name="weight"
          value={formData.weight}
          onChange={handleChange}
          placeholder="Enter your weight"
          min="40"
          max="200"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
          disabled={loading}
        />
      </div>

      {/* Hijab/Beard */}
      <div>
        <label className="block text-sm font-medium mb-3">
          {gender === 'FEMALE' ? 'Hijab Style' : 'Beard Style'}{' '}
          <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {(gender === 'FEMALE' ? HIJAB_STYLES : BEARD_STYLES).map((style) => (
            <label key={style} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="hijabOrBeard"
                value={style}
                checked={formData.hijabOrBeard === style}
                onChange={handleChange}
                disabled={loading}
              />
              <span>{style}</span>
            </label>
          ))}
        </div>
        {fieldErrors.hijabOrBeard && (
          <p className="text-red-400 text-sm mt-2">{fieldErrors.hijabOrBeard}</p>
        )}
      </div>

      {/* Madhab */}
      <div>
        <label htmlFor="madhhabOrManhaj" className="block text-sm font-medium mb-2">
          Sunni Madhab <span className="text-red-500">*</span>
        </label>
        <select
          id="madhhabOrManhaj"
          name="madhhabOrManhaj"
          value={formData.madhhabOrManhaj}
          onChange={handleChange}
          className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:border-green-500 ${
            fieldErrors.madhhabOrManhaj ? 'border-red-500' : 'border-gray-600'
          }`}
          disabled={loading}
        >
          <option value="">Select madhab</option>
          {MADHABS.map((madhab) => (
            <option key={madhab} value={madhab}>
              {madhab}
            </option>
          ))}
        </select>
        {fieldErrors.madhhabOrManhaj && (
          <p className="text-red-400 text-sm mt-1">{fieldErrors.madhhabOrManhaj}</p>
        )}
      </div>
    </form>
  );
}

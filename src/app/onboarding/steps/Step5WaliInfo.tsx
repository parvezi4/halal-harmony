'use client';

import { FormEvent, useState } from 'react';
import type {
  OnboardingStep5FemaleFormData,
  OnboardingStep5MaleFormData,
} from '@/lib/validators/onboarding';

interface Step5WaliInfoProps {
  // eslint-disable-next-line no-unused-vars
  onData: (_data: OnboardingStep5FemaleFormData | OnboardingStep5MaleFormData) => void;
  // eslint-disable-next-line no-unused-vars
  onSaveAndContinue: (_data: OnboardingStep5FemaleFormData | OnboardingStep5MaleFormData) => void;
  loading: boolean;
  gender: 'MALE' | 'FEMALE';
  fieldErrors: Record<string, string>;
  initialData?: Partial<OnboardingStep5FemaleFormData | OnboardingStep5MaleFormData>;
}

const WALI_RELATIONSHIPS = ['Father', 'Brother', 'Uncle', 'Grandfather', 'Imam', 'Other'];

export default function Step5WaliInfo({
  onData,
  onSaveAndContinue,
  loading,
  gender,
  fieldErrors,
  initialData,
}: Step5WaliInfoProps) {
  const initialFemaleData =
    gender === 'FEMALE'
      ? (initialData as Partial<OnboardingStep5FemaleFormData> | undefined)
      : undefined;

  const [formData, setFormData] = useState<
    | {
        waliName: string;
        waliRelationship: string;
        waliEmail: string;
        waliPhone: string;
      }
    | { confirmed: boolean }
  >(
    gender === 'FEMALE'
      ? {
          waliName: initialFemaleData?.waliName || '',
          waliRelationship: initialFemaleData?.waliRelationship || '',
          waliEmail: initialFemaleData?.waliEmail || '',
          waliPhone: initialFemaleData?.waliPhone || '',
        }
      : {
          confirmed: true,
        }
  );

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (gender === 'FEMALE') {
      const femaleForm = formData as {
        waliName: string;
        waliRelationship: string;
        waliEmail: string;
        waliPhone: string;
      };
      onSaveAndContinue({
        waliName: femaleForm.waliName,
        waliRelationship:
          femaleForm.waliRelationship as OnboardingStep5FemaleFormData['waliRelationship'],
        waliEmail: femaleForm.waliEmail,
        waliPhone: femaleForm.waliPhone,
      });
      return;
    }

    onSaveAndContinue({ confirmed: true });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: value,
    };
    setFormData(updatedFormData);
    // Only call onData for female forms with proper typing
    if (gender === 'FEMALE' && 'waliName' in updatedFormData) {
      onData({
        waliName: updatedFormData.waliName,
        waliRelationship:
          updatedFormData.waliRelationship as OnboardingStep5FemaleFormData['waliRelationship'],
        waliEmail: updatedFormData.waliEmail,
        waliPhone: updatedFormData.waliPhone,
      });
    }
  };

  if (gender === 'MALE') {
    return (
      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 rounded-lg p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold mb-6">Step 5: Complete Your Profile</h2>

        <div className="p-6 bg-green-900 bg-opacity-30 border border-green-700 rounded-lg">
          <h3 className="text-lg font-bold text-green-200 mb-4">✓ Profile Summary</h3>
          <p className="text-green-100 mb-4">
            Your profile is now complete with all mandatory information. Alhamdulillah!
          </p>
          <ul className="space-y-2 text-green-100 text-sm">
            <li>✓ Basic information</li>
            <li>✓ Islamic background</li>
            <li>✓ Marital status & family</li>
            <li>✓ Preferences</li>
          </ul>
        </div>

        <div className="p-4 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg">
          <h4 className="font-medium text-blue-200 mb-2">What&apos;s next?</h4>
          <ol className="list-decimal list-inside space-y-2 text-blue-100 text-sm">
            <li>Add a profile photo (optional but encouraged)</li>
            <li>Wait for profile approval</li>
            <li>Start searching for matches</li>
            <li>Connect with potential spouses</li>
          </ol>
        </div>

        <div className="p-4 bg-gray-700 rounded-lg">
          <p className="text-gray-300 text-sm">
            📸 Remember: A photo significantly increases your chances of finding a suitable match!
            After completing this step, you&apos;ll have the option to upload a modest photo.
          </p>
        </div>
      </form>
    );
  }

  // Female form - Wali Information
  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 rounded-lg p-6 md:p-8">
      <h2 className="text-xl md:text-2xl font-bold mb-6">Step 5: Wali (Guardian) Information</h2>

      <div className="p-4 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg mb-6">
        <p className="text-blue-200 text-sm">
          💬 For our sisters&apos; safety and Islamic guidance, we ask to store your Wali&apos;s
          (guardian) contact details. This ensures that any serious inquiries can involve your
          trusted guardian.
        </p>
        <a
          href="#"
          className="text-blue-300 hover:text-blue-200 text-sm mt-2 inline-block underline"
        >
          Learn more about Wali involvement
        </a>
      </div>

      {/* Wali Name */}
      <div>
        <label htmlFor="waliName" className="block text-sm font-medium mb-2">
          Wali Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="waliName"
          name="waliName"
          value={(formData as OnboardingStep5FemaleFormData).waliName || ''}
          onChange={handleChange}
          placeholder="e.g., Father, Uncle, Brother"
          className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 ${
            fieldErrors.waliName ? 'border-red-500' : 'border-gray-600'
          }`}
          disabled={loading}
        />
        {fieldErrors.waliName && (
          <p className="text-red-400 text-sm mt-1">{fieldErrors.waliName}</p>
        )}
      </div>

      {/* Wali Relationship */}
      <div>
        <label htmlFor="waliRelationship" className="block text-sm font-medium mb-2">
          Relationship to Wali <span className="text-red-500">*</span>
        </label>
        <select
          id="waliRelationship"
          name="waliRelationship"
          value={(formData as OnboardingStep5FemaleFormData).waliRelationship || ''}
          onChange={handleChange}
          className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:border-green-500 ${
            fieldErrors.waliRelationship ? 'border-red-500' : 'border-gray-600'
          }`}
          disabled={loading}
        >
          <option value="">Select relationship</option>
          {WALI_RELATIONSHIPS.map((rel) => (
            <option key={rel} value={rel}>
              {rel}
            </option>
          ))}
        </select>
        {fieldErrors.waliRelationship && (
          <p className="text-red-400 text-sm mt-1">{fieldErrors.waliRelationship}</p>
        )}
      </div>

      {/* Wali Email */}
      <div>
        <label htmlFor="waliEmail" className="block text-sm font-medium mb-2">
          Wali Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="waliEmail"
          name="waliEmail"
          value={(formData as OnboardingStep5FemaleFormData).waliEmail || ''}
          onChange={handleChange}
          placeholder="wali@example.com"
          className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 ${
            fieldErrors.waliEmail ? 'border-red-500' : 'border-gray-600'
          }`}
          disabled={loading}
        />
        {fieldErrors.waliEmail && (
          <p className="text-red-400 text-sm mt-1">{fieldErrors.waliEmail}</p>
        )}
      </div>

      {/* Wali Phone */}
      <div>
        <label htmlFor="waliPhone" className="block text-sm font-medium mb-2">
          Wali Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="waliPhone"
          name="waliPhone"
          value={(formData as OnboardingStep5FemaleFormData).waliPhone || ''}
          onChange={handleChange}
          placeholder="+1 (555) 000-0000"
          className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 ${
            fieldErrors.waliPhone ? 'border-red-500' : 'border-gray-600'
          }`}
          disabled={loading}
        />
        {fieldErrors.waliPhone && (
          <p className="text-red-400 text-sm mt-1">{fieldErrors.waliPhone}</p>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="p-4 bg-gray-700 rounded-lg">
        <p className="text-gray-300 text-sm">
          <span className="font-medium">🔒 Privacy:</span> This information is stored privately and
          will never be shown in your public profile. It&apos;s only used for serious inquiries
          where Wali involvement is appropriate.
        </p>
      </div>
    </form>
  );
}

'use client';

import { FormEvent, useState } from 'react';
import type { OnboardingStep3FormData } from '@/lib/validators/onboarding';

interface Step3MaritalFamilyProps {
  onData: (data: OnboardingStep3FormData) => void;
  onSaveAndContinue: (data: OnboardingStep3FormData) => void;
  loading: boolean;
  gender: 'MALE' | 'FEMALE';
  fieldErrors: Record<string, string>;
  initialData?: Partial<OnboardingStep3FormData>;
}

const FEMALE_MARITAL_STATUSES = ['Virgin', 'Divorced', 'Annulled'];
const MALE_MARITAL_STATUSES = ['Virgin', 'Married', 'Separated'];
const RELOCATE_OPTIONS = ['Yes', 'Maybe', 'No'];

export default function Step3MaritalFamily({
  onData,
  onSaveAndContinue,
  loading,
  gender,
  fieldErrors,
  initialData,
}: Step3MaritalFamilyProps) {
  const [formData, setFormData] = useState({
    maritalStatus: initialData?.maritalStatus || '',
    numberOfChildren: initialData?.numberOfChildren || 0,
    childrenLivingWithMe: initialData?.childrenLivingWithMe
      ? String(initialData.childrenLivingWithMe)
      : '',
    willingToRelocate: initialData?.willingToRelocate || '',
    relocateNotes: initialData?.relocateNotes || '',
  });

  const [showMarriedWarning, setShowMarriedWarning] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Prevent submission if female and married
    if (gender === 'FEMALE' && formData.maritalStatus.toLowerCase() === 'married') {
      setShowMarriedWarning(true);
      return;
    }

    onSaveAndContinue({
      maritalStatus: formData.maritalStatus,
      numberOfChildren: Number(formData.numberOfChildren || 0),
      childrenLivingWithMe: formData.childrenLivingWithMe
        ? Number(formData.childrenLivingWithMe)
        : null,
      willingToRelocate: formData.willingToRelocate as OnboardingStep3FormData['willingToRelocate'],
      relocateNotes: formData.relocateNotes || null,
    });
  };

  const handleMaritalStatusChange = (status: string) => {
    const updatedFormData = {
      ...formData,
      maritalStatus: status,
    };
    setFormData(updatedFormData);
    setShowMarriedWarning(false);
    onData({
      maritalStatus: updatedFormData.maritalStatus,
      numberOfChildren: Number(updatedFormData.numberOfChildren || 0),
      childrenLivingWithMe: updatedFormData.childrenLivingWithMe
        ? Number(updatedFormData.childrenLivingWithMe)
        : null,
      willingToRelocate:
        updatedFormData.willingToRelocate as OnboardingStep3FormData['willingToRelocate'],
      relocateNotes: updatedFormData.relocateNotes || null,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: value,
    };
    setFormData(updatedFormData);
    onData({
      maritalStatus: updatedFormData.maritalStatus,
      numberOfChildren: Number(updatedFormData.numberOfChildren || 0),
      childrenLivingWithMe: updatedFormData.childrenLivingWithMe
        ? Number(updatedFormData.childrenLivingWithMe)
        : null,
      willingToRelocate:
        updatedFormData.willingToRelocate as OnboardingStep3FormData['willingToRelocate'],
      relocateNotes: updatedFormData.relocateNotes || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 rounded-lg p-6 md:p-8">
      <h2 className="text-xl md:text-2xl font-bold mb-6">Step 3: Marital Status & Family</h2>

      {/* Marriage Warning for Females */}
      {showMarriedWarning && gender === 'FEMALE' && (
        <div className="p-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg">
          <p className="text-red-200 font-medium">
            AlHarmony is for single sisters. Married status is not supported at this time.
          </p>
          <p className="text-red-200 text-sm mt-2">
            If your situation changes, we&apos;d love to have you back!
          </p>
        </div>
      )}

      {/* Marital Status */}
      <div>
        <label className="block text-sm font-medium mb-3">
          Marital Status <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {(gender === 'FEMALE' ? FEMALE_MARITAL_STATUSES : MALE_MARITAL_STATUSES).map((status) => (
            <label key={status} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="maritalStatus"
                value={status}
                checked={formData.maritalStatus === status}
                onChange={(e) => handleMaritalStatusChange(e.target.value)}
                disabled={loading}
              />
              <span>{status}</span>
            </label>
          ))}
        </div>
        {fieldErrors.maritalStatus && (
          <p className="text-red-400 text-sm mt-2">{fieldErrors.maritalStatus}</p>
        )}
        {gender === 'FEMALE' && (
          <p className="text-gray-400 text-xs mt-2">
            ✓ Only virgin, divorced, or annulled sisters can join AlHarmony.
          </p>
        )}
      </div>

      {/* Number of Children */}
      <div>
        <label htmlFor="numberOfChildren" className="block text-sm font-medium mb-2">
          Do you have children? <span className="text-gray-400">(optional)</span>
        </label>
        <input
          type="number"
          id="numberOfChildren"
          name="numberOfChildren"
          value={formData.numberOfChildren || 0}
          onChange={handleChange}
          min="0"
          max="10"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
          disabled={loading}
        />
      </div>

      {/* Children Living With You */}
      {Number(formData.numberOfChildren) > 0 && (
        <div>
          <label htmlFor="childrenLivingWithMe" className="block text-sm font-medium mb-2">
            How many children live with you?
          </label>
          <input
            type="number"
            id="childrenLivingWithMe"
            name="childrenLivingWithMe"
            value={formData.childrenLivingWithMe}
            onChange={handleChange}
            min="0"
            max={Number(formData.numberOfChildren)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
            disabled={loading}
          />
        </div>
      )}

      {/* Willing to Relocate */}
      <div>
        <label className="block text-sm font-medium mb-3">
          Willing to Relocate? <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {RELOCATE_OPTIONS.map((option) => (
            <label key={option} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="willingToRelocate"
                value={option.toLowerCase()}
                checked={formData.willingToRelocate === option.toLowerCase()}
                onChange={handleChange}
                disabled={loading}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
        {fieldErrors.willingToRelocate && (
          <p className="text-red-400 text-sm mt-2">{fieldErrors.willingToRelocate}</p>
        )}
      </div>

      {/* Relocate Notes */}
      {formData.willingToRelocate === 'maybe' && (
        <div>
          <label htmlFor="relocateNotes" className="block text-sm font-medium mb-2">
            Tell us more about your relocation plans (optional)
          </label>
          <textarea
            id="relocateNotes"
            name="relocateNotes"
            value={formData.relocateNotes || ''}
            onChange={handleChange}
            placeholder="E.g., I can relocate within the next 2 years..."
            maxLength={200}
            rows={3}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
            disabled={loading}
          />
          <p className="text-gray-400 text-xs mt-1">Max 200 characters</p>
        </div>
      )}
    </form>
  );
}

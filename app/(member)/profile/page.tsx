'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useForm, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProfileUpdateSchema, type ProfileUpdateFormData } from '@/lib/validators/profileUpdate';
import { getProfileData, updateProfile } from '../../actions/profile';
import Footer from '../../components/Footer';

// Constants from onboarding steps
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

const FEMALE_MARITAL_STATUSES = ['Virgin', 'Divorced', 'Annulled'];

const MALE_MARITAL_STATUSES = ['Virgin', 'Married', 'Separated'];

const WALI_RELATIONSHIPS = ['Father', 'Brother', 'Uncle', 'Grandfather', 'Imam', 'Other'];

type ProfilePhoto = {
  id: string;
  url: string;
  isPrimary: boolean;
  isApproved: boolean;
  isBlurred: boolean;
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [photoMessage, setPhotoMessage] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [savedMaritalStatus, setSavedMaritalStatus] = useState('');
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoActionLoading, setPhotoActionLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(ProfileUpdateSchema),
  });

  const numberOfChildren = Number(watch('numberOfChildren') ?? 0);

  async function loadPhotos() {
    setPhotoLoading(true);
    setPhotoMessage('');
    const response = await fetch('/api/profile/photos', { method: 'GET' });
    const data = await response.json();

    if (!response.ok) {
      setPhotoMessage(data?.error || 'Failed to load photos');
      setPhotoLoading(false);
      return;
    }

    setPhotos(data.photos ?? []);
    setPhotoLoading(false);
  }

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) {
      return;
    }

    setPhotoActionLoading(true);
    setPhotoMessage('');

    const formData = new FormData();
    Array.from(fileList).forEach((file) => formData.append('photos', file));

    const response = await fetch('/api/profile/photos', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();

    if (!response.ok) {
      setPhotoMessage(data?.error || 'Failed to upload photo');
      setPhotoActionLoading(false);
      event.target.value = '';
      return;
    }

    setPhotoMessage(data?.message || 'Photo uploaded');
    await loadPhotos();
    setPhotoActionLoading(false);
    event.target.value = '';
  }

  async function handleSetPrimary(photoId: string) {
    setPhotoActionLoading(true);
    setPhotoMessage('');

    const response = await fetch('/api/profile/photos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId }),
    });
    const data = await response.json();

    if (!response.ok) {
      setPhotoMessage(data?.error || 'Failed to set primary photo');
      setPhotoActionLoading(false);
      return;
    }

    setPhotoMessage(data?.message || 'Primary photo updated');
    setPhotos(data?.photos ?? []);
    setPhotoActionLoading(false);
  }

  async function handleDeletePhoto(photoId: string) {
    setPhotoActionLoading(true);
    setPhotoMessage('');

    const response = await fetch('/api/profile/photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId }),
    });
    const data = await response.json();

    if (!response.ok) {
      setPhotoMessage(data?.error || 'Failed to delete photo');
      setPhotoActionLoading(false);
      return;
    }

    setPhotoMessage(data?.message || 'Photo deleted');
    setPhotos(data?.photos ?? []);
    setPhotoActionLoading(false);
  }

  // Fetch profile data on mount
  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      const result = await getProfileData();

      if (result.success && result.data) {
        setGender(result.data.gender);

        // Date input expects YYYY-MM-DD, not a Date object.
        const dateValue = result.data.dateOfBirth
          ? new Date(result.data.dateOfBirth).toISOString().split('T')[0]
          : '';

        const profileData = {
          ...result.data,
          dateOfBirth: dateValue,
        };

        setSavedMaritalStatus(result.data.maritalStatus ?? '');
        reset(profileData);
      } else {
        setMessage(result.errors?.general || 'Failed to load profile');
      }
      setLoading(false);
    }

    fetchProfile();
    loadPhotos();
  }, [reset]);

  const onSubmit = async (data: FieldValues) => {
    setSaving(true);
    setMessage('');

    const result = await updateProfile(data as ProfileUpdateFormData);

    if (result.success) {
      setMessage('Profile updated successfully!');
      globalThis.setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage(result.errors?.general || 'Failed to update profile');
    }

    setSaving(false);
  };

  const baseMaritalOptions = gender === 'FEMALE' ? FEMALE_MARITAL_STATUSES : MALE_MARITAL_STATUSES;
  const maritalOptions =
    savedMaritalStatus && !baseMaritalOptions.includes(savedMaritalStatus)
      ? [savedMaritalStatus, ...baseMaritalOptions]
      : baseMaritalOptions;
  const primaryPhoto = photos.find((photo) => photo.isPrimary) ?? photos[0] ?? null;
  const galleryPhotos = photos.filter((photo) => photo.id !== primaryPhoto?.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading profile...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
          Your profile
        </h1>
        <p className="mt-1 text-xs text-slate-400 sm:text-sm">
          Keep your information clear, modest, and focused on marriage.
        </p>
        {message && (
          <p
            className={`mt-2 text-sm ${
              message.includes('success') ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {message}
          </p>
        )}
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,3fr)]">
        <div className="space-y-4">
          <div className="flex flex-col items-center rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="h-24 w-24 overflow-hidden rounded-full border border-slate-700 bg-slate-800">
              {primaryPhoto ? (
                <Image
                  src={primaryPhoto.url}
                  alt="Primary profile photo"
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">Photo</div>
              )}
            </div>
            <label className="mt-3 cursor-pointer rounded-full border border-slate-700 px-4 py-1.5 text-xs font-semibold text-slate-100 hover:border-slate-500">
              {photoActionLoading ? 'Working...' : 'Upload / Manage photos'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={photoActionLoading}
              />
            </label>
            <p className="mt-2 text-center text-[11px] text-slate-400">
              Please follow modesty guidelines. Photos are reviewed before being visible to others.
            </p>
            {photoMessage && <p className="mt-2 text-center text-[11px] text-slate-300">{photoMessage}</p>}
            {photoLoading && <p className="mt-2 text-center text-[11px] text-slate-400">Loading photos...</p>}
            {primaryPhoto && (
              <div className="mt-2 flex w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-950/40 px-2 py-1 text-[11px] text-slate-300">
                <span>{primaryPhoto.isApproved ? 'Primary approved' : 'Primary pending review'}</span>
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(primaryPhoto.id)}
                  className="rounded border border-red-500/70 px-2 py-1 text-[11px] text-red-200"
                  disabled={photoActionLoading}
                >
                  Delete
                </button>
              </div>
            )}
            {galleryPhotos.length > 0 && (
              <div className="mt-4 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                {galleryPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="rounded-xl border border-slate-700 bg-slate-950/50 p-2 text-xs text-slate-200"
                  >
                    <Image
                      src={photo.url}
                      alt="Profile upload"
                      width={240}
                      height={112}
                      className="h-28 w-full rounded-md object-cover"
                      unoptimized
                    />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">
                        {photo.isPrimary ? 'Primary' : photo.isApproved ? 'Approved' : 'Pending review'}
                      </span>
                      <div className="flex gap-2">
                        {!photo.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(photo.id)}
                            className="rounded border border-slate-600 px-2 py-1 text-[11px]"
                            disabled={photoActionLoading}
                          >
                            Set primary
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="rounded border border-red-500/70 px-2 py-1 text-[11px] text-red-200"
                          disabled={photoActionLoading}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Basic Info Section */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-50">Basic Information</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-300">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('fullName')}
                  className={`h-9 w-full rounded-lg border ${
                    errors.fullName ? 'border-red-500' : 'border-slate-700'
                  } bg-slate-950/60 px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none`}
                  placeholder="Your full name"
                />
                {errors.fullName && (
                  <p className="text-xs text-red-400">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('dateOfBirth')}
                  className={`h-9 w-full rounded-lg border ${
                    errors.dateOfBirth ? 'border-red-500' : 'border-slate-700'
                  } bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none`}
                />
                {errors.dateOfBirth && (
                  <p className="text-xs text-red-400">{errors.dateOfBirth.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">
                  Nationality <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('nationality')}
                  className={`h-9 w-full rounded-lg border ${
                    errors.nationality ? 'border-red-500' : 'border-slate-700'
                  } bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none`}
                >
                  <option value="">Select...</option>
                  {NATIONALITIES.map((nat) => (
                    <option key={nat} value={nat}>
                      {nat}
                    </option>
                  ))}
                </select>
                {errors.nationality && (
                  <p className="text-xs text-red-400">{errors.nationality.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('country')}
                  className={`h-9 w-full rounded-lg border ${
                    errors.country ? 'border-red-500' : 'border-slate-700'
                  } bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none`}
                >
                  <option value="">Select...</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <p className="text-xs text-red-400">{errors.country.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">City (optional)</label>
                <input
                  {...register('city')}
                  className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
                  placeholder="Your city"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Ethnicity (optional)</label>
                <select
                  {...register('ethnicity')}
                  className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none"
                >
                  <option value="">Select...</option>
                  {ETHNICITIES.map((eth) => (
                    <option key={eth} value={eth}>
                      {eth}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* About Me */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <h3 className="text-sm font-semibold text-slate-50">About me</h3>
            <textarea
              {...register('about')}
              className="mt-2 h-24 w-full resize-none rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
              placeholder="Share a brief, modest introduction focused on your deen, character, and what you are seeking in marriage."
            />
            {errors.about && <p className="text-xs text-red-400 mt-1">{errors.about.message}</p>}
          </section>

          {/* Islamic background */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-50">Islamic background</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-300">
                  Practicing level <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('practicingLevel')}
                  className={`h-9 w-full rounded-lg border ${
                    errors.practicingLevel ? 'border-red-500' : 'border-slate-700'
                  } bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none`}
                >
                  <option value="">Select...</option>
                  {PRACTICING_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                {errors.practicingLevel && (
                  <p className="text-xs text-red-400">{errors.practicingLevel.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">
                  Prayer <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('prayerHabit')}
                  className={`h-9 w-full rounded-lg border ${
                    errors.prayerHabit ? 'border-red-500' : 'border-slate-700'
                  } bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none`}
                >
                  <option value="">Select...</option>
                  {PRAYER_FREQUENCIES.map((freq) => (
                    <option key={freq} value={freq}>
                      {freq}
                    </option>
                  ))}
                </select>
                {errors.prayerHabit && (
                  <p className="text-xs text-red-400">{errors.prayerHabit.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">
                  Height <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('height')}
                  className={`h-9 w-full rounded-lg border ${
                    errors.height ? 'border-red-500' : 'border-slate-700'
                  } bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none`}
                >
                  <option value="">Select...</option>
                  {HEIGHTS.map((height) => (
                    <option key={height} value={height}>
                      {height}
                    </option>
                  ))}
                </select>
                {errors.height && <p className="text-xs text-red-400">{errors.height.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">
                  Body Shape <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('bodyShape')}
                  className={`h-9 w-full rounded-lg border ${
                    errors.bodyShape ? 'border-red-500' : 'border-slate-700'
                  } bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none`}
                >
                  <option value="">Select...</option>
                  {BODY_SHAPES.map((shape) => (
                    <option key={shape} value={shape}>
                      {shape}
                    </option>
                  ))}
                </select>
                {errors.bodyShape && (
                  <p className="text-xs text-red-400">{errors.bodyShape.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Weight (kg) (optional)</label>
                <input
                  type="number"
                  {...register('weight', { valueAsNumber: true })}
                  className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
                  placeholder="Weight in kg"
                  min="40"
                  max="200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">
                  {gender === 'FEMALE' ? 'Hijab' : 'Beard'} <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('hijabOrBeard')}
                  className={`h-9 w-full rounded-lg border ${
                    errors.hijabOrBeard ? 'border-red-500' : 'border-slate-700'
                  } bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none`}
                >
                  <option value="">Select...</option>
                  {(gender === 'FEMALE' ? HIJAB_STYLES : BEARD_STYLES).map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
                {errors.hijabOrBeard && (
                  <p className="text-xs text-red-400">{errors.hijabOrBeard.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">
                  Madhhab <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('madhhabOrManhaj')}
                  className={`h-9 w-full rounded-lg border ${
                    errors.madhhabOrManhaj ? 'border-red-500' : 'border-slate-700'
                  } bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none`}
                >
                  <option value="">Select...</option>
                  {MADHABS.map((madhab) => (
                    <option key={madhab} value={madhab}>
                      {madhab}
                    </option>
                  ))}
                </select>
                {errors.madhhabOrManhaj && (
                  <p className="text-xs text-red-400">{errors.madhhabOrManhaj.message}</p>
                )}
              </div>
            </div>
          </section>

          {/* Personal & family */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-50">Personal & family</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-300">
                  Marital status <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('maritalStatus')}
                  className={`h-9 w-full rounded-lg border ${
                    errors.maritalStatus ? 'border-red-500' : 'border-slate-700'
                  } bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none`}
                >
                  <option value="">Select...</option>
                  {maritalOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                {errors.maritalStatus && (
                  <p className="text-xs text-red-400">{errors.maritalStatus.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Number of Children</label>
                <input
                  type="number"
                  {...register('numberOfChildren', { valueAsNumber: true })}
                  className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none"
                  min="0"
                  max="10"
                />
              </div>

              {numberOfChildren > 0 && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Children living with me</label>
                  <input
                    type="number"
                    {...register('childrenLivingWithMe', { valueAsNumber: true })}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none"
                    min="0"
                    max={numberOfChildren}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-slate-300">
                  Willing to Relocate <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('willingToRelocate')}
                  className={`h-9 w-full rounded-lg border ${
                    errors.willingToRelocate ? 'border-red-500' : 'border-slate-700'
                  } bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none`}
                >
                  <option value="">Select...</option>
                  <option value="yes">Yes</option>
                  <option value="maybe">Maybe</option>
                  <option value="no">No</option>
                </select>
                {errors.willingToRelocate && (
                  <p className="text-xs text-red-400">{errors.willingToRelocate.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Education</label>
                <input
                  {...register('education')}
                  className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
                  placeholder="e.g. BSc Computer Science"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Profession</label>
                <input
                  {...register('profession')}
                  className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
                  placeholder="e.g. Software engineer"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Family background</label>
              <textarea
                {...register('familyBackground')}
                className="mt-1 h-20 w-full resize-none rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
                placeholder="Share relevant information about your family, culture, and expectations."
              />
            </div>
          </section>

          {/* Preferences */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-50">Spouse Preferences</h3>
            <div className="space-y-1">
              <label className="text-xs text-slate-300">
                Acceptable spouse status <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-slate-400">Select at least one (max 5)</p>
              <div className="space-y-2">
                {(gender === 'FEMALE'
                  ? ['virgin', 'married', 'separated']
                  : ['virgin', 'divorced', 'annulled']
                ).map((status) => (
                  <label key={status} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={status}
                      {...register('spouseStatusPreferences')}
                      className="h-4 w-4"
                    />
                    <span className="text-xs text-slate-300 capitalize">{status}</span>
                  </label>
                ))}
              </div>
              {errors.spouseStatusPreferences && (
                <p className="text-xs text-red-400">{errors.spouseStatusPreferences.message}</p>
              )}
            </div>
          </section>

          {/* Wali / guardian (for females only) */}
          {gender === 'FEMALE' && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-50">
                Wali / guardian <span className="text-red-500">*</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                This information is private and not displayed on your public profile. It helps us
                encourage candidates to involve your wali appropriately.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">
                    Wali name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('waliName')}
                    className={`h-9 w-full rounded-lg border ${
                      errors.waliName ? 'border-red-500' : 'border-slate-700'
                    } bg-slate-950/60 px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none`}
                    placeholder="Wali name"
                  />
                  {errors.waliName && (
                    <p className="text-xs text-red-400">{errors.waliName.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300">
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('waliRelationship')}
                    className={`h-9 w-full rounded-lg border ${
                      errors.waliRelationship ? 'border-red-500' : 'border-slate-700'
                    } bg-slate-950/60 px-2 text-xs text-slate-100 focus:border-accent-400 focus:outline-none`}
                  >
                    <option value="">Select...</option>
                    {WALI_RELATIONSHIPS.map((rel) => (
                      <option key={rel} value={rel}>
                        {rel}
                      </option>
                    ))}
                  </select>
                  {errors.waliRelationship && (
                    <p className="text-xs text-red-400">{errors.waliRelationship.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    {...register('waliEmail')}
                    className={`h-9 w-full rounded-lg border ${
                      errors.waliEmail ? 'border-red-500' : 'border-slate-700'
                    } bg-slate-950/60 px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none`}
                    placeholder="wali@example.com"
                  />
                  {errors.waliEmail && (
                    <p className="text-xs text-red-400">{errors.waliEmail.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    {...register('waliPhone')}
                    className={`h-9 w-full rounded-lg border ${
                      errors.waliPhone ? 'border-red-500' : 'border-slate-700'
                    } bg-slate-950/60 px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none`}
                    placeholder="+1234567890"
                  />
                  {errors.waliPhone && (
                    <p className="text-xs text-red-400">{errors.waliPhone.message}</p>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </section>

      <div className="-mx-4 border-t border-slate-800 px-4 pt-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-accent-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-accent-400 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-700 bg-slate-900 px-5 py-2 text-xs font-semibold text-slate-100 hover:border-slate-500"
          >
            Preview as others see
          </button>
        </div>
      </div>

      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <Footer />
      </div>
    </form>
  );
}


import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getSearchProfileDetail } from '@/app/actions/search';
import { SendMessageButton } from './SendMessageButton';
import Footer from '../../../components/Footer';
import BackButton from './BackButton';

export default async function SearchProfileDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const result = await getSearchProfileDetail(userId);

  if (!result.success || !result.data) {
    notFound();
  }

  const profile = result.data;
  const location = [profile.city || profile.region, profile.country].filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton />
        {profile.isFavorited && (
          <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-200">
            In favorites
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <SendMessageButton recipientId={userId} />
        </div>
      </div>

      <header className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h1 className="text-xl font-semibold text-slate-50">
          {profile.alias || 'Member'}
          {profile.age
            ? `, ${profile.age}`
            : profile.ageRangeLabel
              ? `, ${profile.ageRangeLabel}`
              : ''}
        </h1>
        <p className="mt-1 text-sm text-slate-300">{location || 'Location hidden'}</p>
        <p className="mt-2 text-xs text-slate-400">
          {[profile.practicingLevel, profile.prayerHabit, profile.hijabOrBeard]
            .filter(Boolean)
            .join(' • ')}
        </p>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-sm font-semibold text-slate-50">Photos</h2>
        {profile.photos.length === 0 ? (
          <p className="mt-2 text-xs text-slate-400">No photos available for your current plan.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-3">
            {profile.photos.map((photo, index) => (
              <div
                key={`${photo.url}-${index}`}
                className="h-16 w-16 overflow-hidden rounded-lg border border-slate-700 bg-slate-800"
              >
                <Image
                  src={photo.url}
                  alt={`Profile photo ${index + 1}`}
                  width={64}
                  height={64}
                  unoptimized
                  className={`h-full w-full object-cover ${photo.isBlurred ? 'blur-md' : ''}`}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-sm font-semibold text-slate-50">Islamic & lifestyle</h2>
          <ul className="mt-3 space-y-1 text-xs text-slate-300">
            <li>Practicing level: {profile.practicingLevel || 'Not shared'}</li>
            <li>Prayer habit: {profile.prayerHabit || 'Not shared'}</li>
            <li>Madhhab/manhaj: {profile.madhhabOrManhaj || 'Not shared'}</li>
            <li>Hijab/beard: {profile.hijabOrBeard || 'Not shared'}</li>
            <li>Smoking: {profile.smoking ? 'Yes' : 'No'}</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-sm font-semibold text-slate-50">Personal details</h2>
          <ul className="mt-3 space-y-1 text-xs text-slate-300">
            <li>Marital status: {profile.maritalStatus || 'Not shared'}</li>
            <li>Children: {profile.numberOfChildren ?? 'Not shared'}</li>
            <li>Nationality: {profile.nationality || 'Not shared'}</li>
            <li>Ethnicity: {profile.ethnicity || 'Not shared'}</li>
            <li>Willing to relocate: {profile.willingToRelocate || 'Not shared'}</li>
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-sm font-semibold text-slate-50">About</h2>
        <p className="mt-2 text-sm text-slate-300">{profile.about || 'Not shared yet.'}</p>
        <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Family background
        </h3>
        <p className="mt-1 text-sm text-slate-300">
          {profile.familyBackground || 'Not shared yet.'}
        </p>
        <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Preferences
        </h3>
        <p className="mt-1 text-sm text-slate-300">{profile.preferences || 'Not shared yet.'}</p>
      </section>

      <div className="-mx-4 mt-2 sm:-mx-6 lg:-mx-8">
        <Footer />
      </div>
    </div>
  );
}

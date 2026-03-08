import Image from 'next/image';
import Link from 'next/link';

type SearchResultCardItem = {
  userId: string;
  profileId: string;
  alias: string | null;
  age: number | null;
  ageRangeLabel: string | null;
  country: string | null;
  cityOrRegion: string | null;
  practicingLevel: string | null;
  hijabOrBeard: string | null;
  smoking: boolean;
  primaryPhotoUrl: string | null;
  primaryPhotoBlurred: boolean;
  isFavorited: boolean;
};

type SearchResultCardProps = {
  result: SearchResultCardItem;
  // eslint-disable-next-line no-unused-vars
  onToggleFavorite: (...args: [string]) => void;
};

export default function SearchResultCard({ result, onToggleFavorite }: SearchResultCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition-colors hover:border-slate-700">
      <Link href={`/search/${result.userId}`} className="block">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
          <div className="h-16 w-16 overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
            {result.primaryPhotoUrl ? (
              <Image
                src={result.primaryPhotoUrl}
                alt="Profile"
                width={64}
                height={64}
                unoptimized
                className={`h-full w-full object-cover ${result.primaryPhotoBlurred ? 'blur-md' : ''}`}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                No photo
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-50">
                {result.alias || 'Member'}
                {result.age ? `, ${result.age}` : result.ageRangeLabel ? `, ${result.ageRangeLabel}` : ''}
              </h3>
              <button
                type="button"
                title={result.isFavorited ? 'Already in favorites' : 'Add to favorites'}
                aria-label={result.isFavorited ? 'Already in favorites' : 'Add to favorites'}
                disabled={result.isFavorited}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (!result.isFavorited) {
                    onToggleFavorite(result.userId);
                  }
                }}
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                  result.isFavorited
                    ? 'border-amber-500/60 bg-amber-500/20 text-amber-200'
                    : 'border-slate-600 bg-slate-900 text-slate-200 hover:border-amber-400 hover:text-amber-200'
                }`}
              >
                *
              </button>
            </div>
            <p className="text-xs text-slate-300">
              {[result.cityOrRegion, result.country].filter(Boolean).join(', ') || 'Location hidden'}
            </p>
            <p className="text-[11px] text-slate-400">
              {[result.practicingLevel, result.hijabOrBeard, result.smoking ? 'Smokes' : 'Non-smoker']
                .filter(Boolean)
                .slice(0, 2)
                .join(' • ')}
            </p>
          </div>
        </div>

          <span className="text-[11px] font-semibold text-accent-200">View profile</span>
        </div>
      </Link>
    </article>
  );
}

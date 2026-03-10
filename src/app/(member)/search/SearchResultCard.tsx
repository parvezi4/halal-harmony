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
  source?: 'search' | 'favorites';
};

export default function SearchResultCard({ result, onToggleFavorite, source = 'search' }: SearchResultCardProps) {
  const profileUrl = source === 'favorites' 
    ? `/search/${result.userId}?from=favorites`
    : `/search/${result.userId}`;

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition-colors hover:border-slate-700">
      <Link href={profileUrl} className="block">
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
                title={result.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                aria-label={result.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onToggleFavorite(result.userId);
                }}
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                  result.isFavorited
                    ? 'border-emerald-400 bg-emerald-500 text-white'
                    : 'border-slate-600 bg-slate-900 text-slate-200 hover:border-emerald-400 hover:text-emerald-300'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill={result.isFavorited ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth={result.isFavorited ? 0 : 1.8}
                >
                  <path
                    d="M12 3.75l2.62 5.31 5.86.85-4.24 4.13 1 5.84L12 17.13l-5.24 2.75 1-5.84-4.24-4.13 5.86-.85L12 3.75z"
                    strokeLinejoin="round"
                  />
                </svg>
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

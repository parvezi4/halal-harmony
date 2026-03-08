'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchResultCard from './SearchResultCard';
import Footer from '../../components/Footer';

type SearchResult = {
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

type SearchResponse = {
  success: boolean;
  data?: {
    results: SearchResult[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
    targetGender: 'MALE' | 'FEMALE' | null;
    freeTier: {
      isPremium: boolean;
      dailyLimit: number;
      viewedToday: number;
      remaining: number;
    } | null;
  };
  errors?: Record<string, string>;
};

const PRACTICING_LEVELS = ['Very practicing', 'Practicing', 'Moderate', 'Less practicing', 'Secular'];
const HIJAB_OR_BEARD_OPTIONS = ['Niqab', 'Hijab', 'Headscarf', 'Full beard', 'Trimmed', 'Clean shaven'];
const MARITAL_OPTIONS = ['virgin', 'divorced', 'annulled', 'married', 'separated'];

type FiltersState = {
  minAge: string;
  maxAge: string;
  country: string;
  cityOrRegion: string;
  maritalStatus: string;
  practicingLevel: string;
  hijabOrBeard: string;
  smoking: '' | 'yes' | 'no';
  education: string;
  profession: string;
  willingToRelocate: '' | 'yes' | 'maybe' | 'no';
};

const initialFilters: FiltersState = {
  minAge: '',
  maxAge: '',
  country: '',
  cityOrRegion: '',
  maritalStatus: '',
  practicingLevel: '',
  hijabOrBeard: '',
  smoking: '',
  education: '',
  profession: '',
  willingToRelocate: '',
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize filters from URL params
  const initializeFiltersFromURL = (): FiltersState => {
    return {
      minAge: searchParams.get('minAge') || '',
      maxAge: searchParams.get('maxAge') || '',
      country: searchParams.get('country') || '',
      cityOrRegion: searchParams.get('cityOrRegion') || '',
      maritalStatus: searchParams.get('maritalStatus') || '',
      practicingLevel: searchParams.get('practicingLevel') || '',
      hijabOrBeard: searchParams.get('hijabOrBeard') || '',
      smoking: (searchParams.get('smoking') as FiltersState['smoking']) || '',
      education: searchParams.get('education') || '',
      profession: searchParams.get('profession') || '',
      willingToRelocate: (searchParams.get('willingToRelocate') as FiltersState['willingToRelocate']) || '',
    };
  };

  const [filters, setFilters] = useState<FiltersState>(initializeFiltersFromURL());
  const [results, setResults] = useState<SearchResult[]>([]);
  const [submitted, setSubmitted] = useState(searchParams.get('submitted') === 'true');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freeTier, setFreeTier] = useState<NonNullable<SearchResponse['data']>['freeTier']>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
  });

  const buildSearchParams = (nextPage: number) => {
    const params = new URLSearchParams();
    params.set('submitted', 'true');
    params.set('page', String(nextPage));

    if (filters.minAge) params.set('minAge', filters.minAge);
    if (filters.maxAge) params.set('maxAge', filters.maxAge);
    if (filters.country) params.set('country', filters.country);
    if (filters.cityOrRegion) params.set('cityOrRegion', filters.cityOrRegion);
    if (filters.maritalStatus) params.set('maritalStatus', filters.maritalStatus);
    if (filters.practicingLevel) params.set('practicingLevel', filters.practicingLevel);
    if (filters.hijabOrBeard) params.set('hijabOrBeard', filters.hijabOrBeard);
    if (filters.smoking) params.set('smoking', filters.smoking);
    if (filters.education) params.set('education', filters.education);
    if (filters.profession) params.set('profession', filters.profession);
    if (filters.willingToRelocate) params.set('willingToRelocate', filters.willingToRelocate);

    return params;
  };

  const fetchResults = async (nextPage = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = buildSearchParams(nextPage);
      
      // Update URL with current filters
      router.push(`/search?${params.toString()}`, { scroll: false });
      
      const response = await fetch(`/api/search?${params.toString()}`, { method: 'GET' });
      const payload = (await response.json()) as SearchResponse;

      if (!response.ok || !payload.success || !payload.data) {
        setError(payload.errors?.general || 'Failed to load search results');
        return;
      }

      setResults(payload.data.results);
      setPagination(payload.data.pagination);
      setFreeTier(payload.data.freeTier);
    } catch {
      setError('Failed to load search results');
    } finally {
      setLoading(false);
    }
  };

  // Restore search results on mount if URL indicates a search was performed
  useEffect(() => {
    if (submitted) {
      const pageParam = searchParams.get('page');
      const page = pageParam ? parseInt(pageParam, 10) : 1;
      void fetchResults(page);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onApplyFilters = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    await fetchResults(1);
  };

  const onClearFilters = () => {
    setFilters(initialFilters);
    setResults([]);
    setSubmitted(false);
    setError(null);
    setPagination({ total: 0, page: 1, pageSize: 20, totalPages: 1 });
    
    // Clear URL params
    router.push('/search', { scroll: false });
  };

  const onToggleFavorite = async (targetUserId: string) => {
    if (results.some((item) => item.userId === targetUserId && item.isFavorited)) {
      return;
    }

    const previous = results;
    setResults((current) =>
      current.map((item) =>
        item.userId === targetUserId ? { ...item, isFavorited: true } : item
      )
    );

    const response = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId }),
    });

    if (!response.ok) {
      setResults(previous);
    }
  };

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">Search</h1>
        <p className="mt-1 text-xs text-slate-400 sm:text-sm">
          Find profiles using halal-compatible filters. Results appear after you apply filters.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,3fr)]">
        <aside className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-sm font-semibold text-slate-50">Filters</h2>

          <form className="space-y-3 text-xs text-slate-200" onSubmit={onApplyFilters}>
            <p className="text-[11px] text-slate-400">
              Gender is inferred automatically from your profile.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-300">Min age</label>
                <input
                  type="number"
                  min={14}
                  className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100"
                  value={filters.minAge}
                  onChange={(e) => setFilters((f) => ({ ...f, minAge: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-300">Max age</label>
                <input
                  type="number"
                  min={14}
                  className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100"
                  value={filters.maxAge}
                  onChange={(e) => setFilters((f) => ({ ...f, maxAge: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Country</label>
              <input
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100"
                value={filters.country}
                onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">City / Region</label>
              <input
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100"
                value={filters.cityOrRegion}
                onChange={(e) => setFilters((f) => ({ ...f, cityOrRegion: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Marital status</label>
              <select
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100"
                value={filters.maritalStatus}
                onChange={(e) => setFilters((f) => ({ ...f, maritalStatus: e.target.value }))}
              >
                <option value="">Any</option>
                {MARITAL_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Practicing level</label>
              <select
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100"
                value={filters.practicingLevel}
                onChange={(e) => setFilters((f) => ({ ...f, practicingLevel: e.target.value }))}
              >
                <option value="">Any</option>
                {PRACTICING_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Hijab / beard</label>
              <select
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100"
                value={filters.hijabOrBeard}
                onChange={(e) => setFilters((f) => ({ ...f, hijabOrBeard: e.target.value }))}
              >
                <option value="">Any</option>
                {HIJAB_OR_BEARD_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Smoking</label>
              <select
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100"
                value={filters.smoking}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, smoking: e.target.value as FiltersState['smoking'] }))
                }
              >
                <option value="">Any</option>
                <option value="no">Does not smoke</option>
                <option value="yes">Smokes</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Education</label>
              <input
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100"
                value={filters.education}
                onChange={(e) => setFilters((f) => ({ ...f, education: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Profession</label>
              <input
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100"
                value={filters.profession}
                onChange={(e) => setFilters((f) => ({ ...f, profession: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Willing to relocate</label>
              <select
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-xs text-slate-100"
                value={filters.willingToRelocate}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    willingToRelocate: e.target.value as FiltersState['willingToRelocate'],
                  }))
                }
              >
                <option value="">Any</option>
                <option value="yes">Yes</option>
                <option value="maybe">Maybe</option>
                <option value="no">No</option>
              </select>
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-accent-500 px-4 py-1.5 font-semibold text-slate-950 hover:bg-accent-400 disabled:opacity-60"
              >
                {loading ? 'Applying...' : 'Apply filters'}
              </button>
              <button
                type="button"
                onClick={onClearFilters}
                className="rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5 font-semibold text-slate-100 hover:border-slate-500"
              >
                Clear
              </button>
            </div>
          </form>
        </aside>

        <section className="space-y-4">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-300 sm:text-sm">
              {submitted ? (
                <>
                  Showing <span className="font-semibold text-accent-200">{pagination.total}</span>{' '}
                  matching profiles.
                </>
              ) : (
                'Apply filters to start searching.'
              )}
            </p>
            {freeTier && !freeTier.isPremium && (
              <p className="text-[11px] text-amber-300">
                Free plan views left today: {freeTier.remaining}/{freeTier.dailyLimit}
              </p>
            )}
          </header>

          {error && (
            <div className="rounded-lg border border-red-700 bg-red-950/30 p-3 text-xs text-red-200">
              {error}
            </div>
          )}

          {!submitted && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
              No matches shown yet. Apply your filters to see results.
            </div>
          )}

          {submitted && !loading && results.length === 0 && !error && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
              No matches found. Try widening age, location, or lifestyle filters.
            </div>
          )}

          {results.map((result) => (
            <SearchResultCard key={result.profileId} result={result} onToggleFavorite={onToggleFavorite} />
          ))}

          {submitted && pagination.totalPages > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                disabled={loading || pagination.page <= 1}
                onClick={() => void fetchResults(pagination.page - 1)}
                className="rounded border border-slate-700 px-2 py-1 text-slate-200 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-slate-300">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={loading || pagination.page >= pagination.totalPages}
                onClick={() => void fetchResults(pagination.page + 1)}
                className="rounded border border-slate-700 px-2 py-1 text-slate-200 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </section>
      </section>

      <div className="-mx-4 mt-8 sm:-mx-6 lg:-mx-8">
        <Footer />
      </div>
    </div>
  );
}

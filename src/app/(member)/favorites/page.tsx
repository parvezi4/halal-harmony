'use client';

import { useEffect, useState } from 'react';
import SearchResultCard from '../search/SearchResultCard';
import Footer from '../../components/Footer';

type FavoriteItem = {
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
};

type FavoritesResponse = {
  success: boolean;
  data?: {
    favorites: FavoriteItem[];
    freeTier?: FreeTierStatus;
  };
  errors?: Record<string, string>;
};

type ToggleFavoriteResponse = {
  success: boolean;
  data?: {
    targetUserId?: string;
    isFavorited?: boolean;
  };
  errors?: Record<string, string>;
};

type FreeTierStatus = {
  isPremium: boolean;
  dailyLimit: number;
  viewedToday: number;
  remaining: number;
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<(FavoriteItem & { isFavorited: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [freeTier, setFreeTier] = useState<FreeTierStatus | null>(null);

  useEffect(() => {
    async function loadFavorites() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/favorites', { method: 'GET' });
        const payload = (await response.json()) as FavoritesResponse;

        if (!response.ok || !payload.success || !payload.data) {
          setError(payload.errors?.general || 'Failed to load favorites');
          return;
        }

        setFavorites(payload.data.favorites.map((item) => ({ ...item, isFavorited: true })));
        setFreeTier(payload.data.freeTier ?? null);
      } catch {
        setError('Failed to load favorites');
      } finally {
        setLoading(false);
      }
    }

    void loadFavorites();
  }, []);

  const onToggleFavorite = async (targetUserId: string) => {
    const previous = favorites;
    setError(null);
    setFavorites((current) => current.filter((item) => item.userId !== targetUserId));

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });

      const payload = (await response.json()) as ToggleFavoriteResponse;

      if (!response.ok || !payload.success || payload.data?.targetUserId !== targetUserId) {
        setFavorites(previous);
        setError(payload.errors?.general || 'Failed to update favorites');
        return;
      }

      // Keep list and server state aligned if backend response differs from optimistic removal.
      if (payload.data?.isFavorited === true) {
        setFavorites(previous);
      }
    } catch {
      setFavorites(previous);
      setError('Failed to update favorites');
    }
  };

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">Favorites</h1>
        <p className="mt-1 text-xs text-slate-400 sm:text-sm">
          Profiles you have shortlisted privately.
        </p>
        {freeTier && !freeTier.isPremium && (
          <p className="mt-2 text-[11px] text-amber-300">
            Free plan views left today: {freeTier.remaining}/{freeTier.dailyLimit}
          </p>
        )}
      </header>

      {loading && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
          Loading favorites...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-700 bg-red-950/30 p-3 text-xs text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && favorites.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
          No favorites yet. Use the Favorite button on search results to shortlist profiles.
        </div>
      )}

      {!loading && !error && favorites.map((result) => (
        <SearchResultCard key={result.profileId} result={result} onToggleFavorite={onToggleFavorite} source="favorites" />
      ))}

      <div className="-mx-4 mt-8 sm:-mx-6 lg:-mx-8">
        <Footer />
      </div>
    </div>
  );
}

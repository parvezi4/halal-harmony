'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type ProfilePhoto = {
  id: string;
  url: string;
  isPrimary: boolean;
  isApproved: boolean;
  isBlurred: boolean;
  fileSizeBytes: number | null;
  mimeType: string | null;
};

const MAX_PHOTOS = 5;
const MAX_BYTES = 2 * 1024 * 1024;

function formatBytes(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

export default function OnboardingPhotoPage() {
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const remainingSlots = useMemo(() => MAX_PHOTOS - photos.length, [photos.length]);

  async function loadPhotos() {
    const response = await fetch('/api/profile/photos', { method: 'GET' });
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    setPhotos(data.photos ?? []);
  }

  useEffect(() => {
    loadPhotos();
  }, []);

  function onFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setError(null);
    setMessage(null);

    if (files.length > remainingSlots) {
      setError(`You can upload only ${remainingSlots} more photo(s).`);
      return;
    }

    for (const file of files) {
      if (file.size > MAX_BYTES) {
        setError(`File ${file.name} exceeds 2MB.`);
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError(`File ${file.name} must be JPG, PNG, or WebP.`);
        return;
      }
    }

    setSelectedFiles(files);
  }

  async function uploadFiles() {
    if (selectedFiles.length === 0) {
      setError('Please select at least one image.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('photos', file);
      });

      const response = await fetch('/api/profile/photos', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Upload failed');
        return;
      }

      setMessage(data.message ?? 'Upload successful');
      setSelectedFiles([]);
      await loadPhotos();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-semibold">Upload Profile Photos</h1>
        <p className="text-slate-300 text-sm">
          Upload up to 5 photos. Each photo must be 2MB or smaller. Photos stay blurred until mutual
          photo exchange approval.
        </p>

        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 text-sm space-y-2">
          <div>Allowed formats: JPG, PNG, WebP</div>
          <div>Size per photo: max 2MB</div>
          <div>Photo limit per profile: 5</div>
          <div>Remaining slots: {remainingSlots}</div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 space-y-4">
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={onFileSelection}
            disabled={loading || remainingSlots <= 0}
          />

          {selectedFiles.length > 0 && (
            <ul className="text-sm text-slate-300 space-y-1">
              {selectedFiles.map((file) => (
                <li key={`${file.name}-${file.size}`}>
                  {file.name} ({formatBytes(file.size)})
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={uploadFiles}
            disabled={loading || selectedFiles.length === 0}
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload Photos'}
          </button>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-emerald-400">{message}</p>}
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <h2 className="text-lg font-medium mb-3">Current Photos ({photos.length}/5)</h2>
          {photos.length === 0 ? (
            <p className="text-sm text-slate-400">No photos uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="rounded border border-slate-700 p-2 bg-slate-800">
                  <img src={photo.url} alt="Profile" className="h-24 w-full object-cover rounded" />
                  <div className="mt-2 text-xs text-slate-300 space-y-1">
                    <div>{photo.isPrimary ? 'Primary photo' : 'Secondary photo'}</div>
                    <div>{photo.isBlurred ? 'Blurred in search' : 'Visible in search'}</div>
                    <div>
                      {photo.fileSizeBytes ? formatBytes(photo.fileSizeBytes) : 'Unknown size'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard" className="rounded bg-slate-700 px-4 py-2 text-sm">
            Go to Dashboard
          </Link>
          <Link href="/search" className="rounded bg-emerald-700 px-4 py-2 text-sm">
            Start Searching
          </Link>
        </div>
      </div>
    </div>
  );
}

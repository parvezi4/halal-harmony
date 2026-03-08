'use client';

import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="text-xs font-semibold text-accent-200 hover:text-accent-100"
    >
      {'<-'} Back to search
    </button>
  );
}

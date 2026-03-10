'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  
  const backText = from === 'favorites' ? 'Back to favorites' : 'Back to search';

  return (
    <button
      onClick={() => router.back()}
      className="text-xs font-semibold text-accent-200 hover:text-accent-100"
    >
      {'<-'} {backText}
    </button>
  );
}

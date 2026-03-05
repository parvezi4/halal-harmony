'use client';

import { signOut } from 'next-auth/react';
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/solid';

export default function LogoutButton() {
  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/login' });
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-200 hover:bg-slate-800 hover:text-accent-200 transition-colors"
      title="Logout"
    >
      <ArrowLeftOnRectangleIcon className="h-4 w-4" />
      <span className="hidden sm:inline">Logout</span>
    </button>
  );
}

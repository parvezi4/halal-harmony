'use client';

import { signOut } from 'next-auth/react';
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/solid';

export default function AdminLogoutButton() {
  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/admin/login' });
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-slate-200 transition-colors hover:bg-slate-800 hover:text-accent-200 sm:text-sm"
      title="Logout"
    >
      <ArrowLeftOnRectangleIcon className="h-4 w-4" />
      <span className="hidden sm:inline">Logout</span>
    </button>
  );
}

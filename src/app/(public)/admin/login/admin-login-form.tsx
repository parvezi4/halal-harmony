'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signIn } from 'next-auth/react';

export function AdminLoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // First, validate credentials and role via our admin login API
      const validationRes = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const validationData = await validationRes.json();

      if (!validationRes.ok || !validationData.success) {
        setError(validationData.error || 'Login validation failed');
        setLoading(false);
        return;
      }

      // If validation passed, use NextAuth to create the session
      const authRes = await signIn('credentials', {
        email: form.email,
        password: form.password,
        portal: 'admin',
        redirect: false,
      });

      setLoading(false);

      if (authRes?.error) {
        setError('Failed to establish session');
        return;
      }

      if (!authRes?.ok) {
        setError('Login failed. Please try again.');
        return;
      }

      // Redirect to admin dashboard on successful login
      router.push('/admin');
    } catch (err) {
      setLoading(false);
      console.error('Login error:', err);
      setError('An unexpected error occurred');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-50">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            HH
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Admin Login</h1>
        </div>
        <p className="mt-1 text-xs text-slate-400">Administrators and moderators only</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3 text-sm">
          <div className="space-y-1">
            <label className="text-xs text-slate-300">Email</label>
            <input
              type="email"
              required
              placeholder="admin@example.com"
              className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              disabled={loading}
            />
          </div>

          {error && <p className="text-xs text-rose-300">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-70"
          >
            {loading ? 'Logging in...' : 'Admin Login'}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-800 pt-4">
          <p className="text-center text-xs text-slate-500">
            Not an admin?{' '}
            <a href="/auth/login" className="text-accent-400 hover:text-accent-300">
              User login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

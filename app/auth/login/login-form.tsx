'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { signIn } from 'next-auth/react';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError('Invalid email or password');
      return;
    }
    router.push('/dashboard');
  }

  const registered = searchParams.get('registered') === '1';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-50">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <h1 className="text-xl font-semibold tracking-tight">Login</h1>
        {registered && (
          <p className="mt-1 text-xs text-emerald-300">Account created. You can now log in.</p>
        )}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-sm">
          <div className="space-y-1">
            <label className="text-xs text-slate-300">Email</label>
            <input
              type="email"
              required
              className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-300">Password</label>
            <input
              type="password"
              required
              className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>
          {error && <p className="text-xs text-rose-300">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-full bg-accent-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-accent-400 disabled:opacity-70"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

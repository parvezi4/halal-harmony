import { Suspense } from 'react';
import { LoginForm } from './login-form';

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-50">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <div className="h-6 w-20 animate-pulse rounded bg-slate-700" />
        <div className="mt-6 space-y-3">
          <div className="h-9 w-full animate-pulse rounded-lg bg-slate-700" />
          <div className="h-9 w-full animate-pulse rounded-lg bg-slate-700" />
          <div className="h-9 w-full animate-pulse rounded-full bg-slate-700" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

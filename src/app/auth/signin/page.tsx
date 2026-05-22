'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useState, FormEvent, Suspense } from 'react';

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const result = await signIn('credentials', {
      username: form.get('username') as string,
      password: form.get('password') as string,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Invalid username or password. Please try again.');
    } else {
      // Hard navigation ensures the session cookie is fully committed before
      // the middleware evaluates the next request. router.push can race and
      // send requests before the Set-Cookie header is processed by the browser.
      window.location.href = callbackUrl;
    }
  }


  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_45%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)] flex items-center justify-center px-4 py-16 text-slate-900">
      <div className="w-full max-w-sm">

        {/* Wordmark */}
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500 mb-3">
            BillGen
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Sign in to your workspace
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Enter your credentials to continue
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">

          {/* Error banner */}
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                placeholder="admin"
                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Submit */}
            <button
              id="signin-submit"
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Single-tenant workspace · Admin access only
        </p>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}

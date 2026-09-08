import Link from "next/link";

import { PublicSiteHeader } from "@/components/brand-lockup";
import { login } from "../actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-cream pt-3">
      <PublicSiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-ink-soft/15 bg-cream-card p-8 shadow-md">
        <h1 className="text-3xl font-semibold text-zinc-950">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Continue to your mentoring workspace.
        </p>

        {error ? (
          <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mt-6 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}

        <form action={login} className="mt-6 space-y-5">
          <label className="block text-sm font-medium text-zinc-800">
            Email
            <input
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-brand-deep"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label className="block text-sm font-medium text-zinc-800">
            Password
            <input
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-brand-deep"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button
            className="w-full rounded-lg bg-brand-deep px-4 py-2.5 font-medium text-white hover:bg-brand"
            type="submit"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          New to Queens Match?{" "}
          <Link className="font-medium text-brand-deep hover:underline" href="/register">
            Create an account
          </Link>
        </p>
      </section>
      </main>
    </div>
  );
}

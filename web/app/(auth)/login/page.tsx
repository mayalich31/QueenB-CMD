import Link from "next/link";

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
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold tracking-widest text-amber-700">
          QUEENS MATCH
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-950">Sign in</h1>
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
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-600"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label className="block text-sm font-medium text-zinc-800">
            Password
            <input
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-600"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button
            className="w-full rounded-lg bg-zinc-950 px-4 py-2.5 font-medium text-white hover:bg-zinc-800"
            type="submit"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          New to Queens Match?{" "}
          <Link className="font-medium text-amber-700 hover:underline" href="/register">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}

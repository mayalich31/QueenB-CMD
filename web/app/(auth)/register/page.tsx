import Link from "next/link";

import { register } from "../actions";

type RegisterPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold tracking-widest text-amber-700">
          QUEENS MATCH
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-950">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Start as a mentee. You can activate mentoring from your settings
          later.
        </p>

        {error ? (
          <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <form action={register} className="mt-6 space-y-5">
          <label className="block text-sm font-medium text-zinc-800">
            Username
            <input
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-600"
              name="username"
              autoComplete="username"
              minLength={3}
              maxLength={30}
              required
            />
          </label>
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
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />
            <span className="mt-2 block text-xs text-zinc-500">
              Use 8–72 characters with uppercase, lowercase, and a number.
            </span>
          </label>
          <button
            className="w-full rounded-lg bg-zinc-950 px-4 py-2.5 font-medium text-white hover:bg-zinc-800"
            type="submit"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          Already registered?{" "}
          <Link className="font-medium text-amber-700 hover:underline" href="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}

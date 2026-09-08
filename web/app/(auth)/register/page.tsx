import Link from "next/link";

import { PublicSiteHeader } from "@/components/brand-lockup";
import { OptionalProfileFieldsForm } from "@/components/profile/optional-profile-fields-form";
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
    <div className="flex min-h-screen flex-col bg-cream">
      <PublicSiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
      <section className="w-full max-w-2xl rounded-2xl border border-brand/30 bg-cream-card p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-zinc-950">
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
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-brand-deep"
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
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />
            <span className="mt-2 block text-xs text-zinc-500">
              Use 8–72 characters with uppercase, lowercase, and a number.
            </span>
          </label>
          <OptionalProfileFieldsForm />
          <button
            className="w-full rounded-lg bg-brand-deep px-4 py-2.5 font-medium text-white hover:bg-brand"
            type="submit"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          Already registered?{" "}
          <Link className="font-medium text-brand-deep hover:underline" href="/login">
            Sign in
          </Link>
        </p>
      </section>
      </main>
    </div>
  );
}

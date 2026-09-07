import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <p className="font-semibold tracking-widest text-amber-700">
            QUEENS MATCH
          </p>
          <nav className="flex items-center gap-2">
            <Link
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              href="/register"
            >
              Create an account
            </Link>
            <Link
              className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              href="/login"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16">
        <p className="text-sm font-medium text-amber-700">Mentoring for Queens</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Find a mentor. Share your experience.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-zinc-600">
          Queens Match connects mentees with mentors for career conversations,
          mock interviews, and focused advice. Sign in to browse the directory
          and manage your meetings.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="rounded-lg bg-zinc-950 px-5 py-3 font-medium text-white hover:bg-zinc-800"
            href="/login"
          >
            Login
          </Link>
          <Link
            className="rounded-lg border border-zinc-300 bg-white px-5 py-3 font-medium text-zinc-800 hover:bg-zinc-100"
            href="/register"
          >
            Create an account
          </Link>
        </div>
      </section>
    </main>
  );
}

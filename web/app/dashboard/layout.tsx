import Link from "next/link";
import { redirect } from "next/navigation";

import { findUserById } from "@/lib/dal/users";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) {
    redirect("/login");
  }

  const user = await findUserById(claims.sub);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link className="font-semibold tracking-widest text-amber-700" href="/">
            QUEENS MATCH
          </Link>
          <nav className="flex items-center gap-2" aria-label="Workspace">
            <Link
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100"
              href="/dashboard/mentee"
            >
              Mentee
            </Link>
            <Link
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100"
              href="/dashboard/mentee/directory"
            >
              Directory
            </Link>
            {user?.isMentor ? (
              <Link
                className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100"
                href="/dashboard/mentor"
              >
                Mentor
              </Link>
            ) : null}
            <Link
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100"
              href="/dashboard/settings/mentor"
            >
              {user?.isMentor ? "Mentor settings" : "Become a mentor"}
            </Link>
            <form action={logout}>
              <button
                className="rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
                type="submit"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

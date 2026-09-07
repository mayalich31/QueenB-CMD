import Link from "next/link";

import { logout } from "@/app/(auth)/actions";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdminUser } from "@/lib/services/admin-authorization";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminUser();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            className="font-semibold tracking-widest text-amber-700"
            href="/admin"
          >
            QUEENS MATCH ADMIN
          </Link>
          <nav className="flex items-center gap-2" aria-label="Admin workspace">
            <Link
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100"
              href="/dashboard"
            >
              Home
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
      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8">
        <aside className="w-48 shrink-0">
          <AdminSidebar />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

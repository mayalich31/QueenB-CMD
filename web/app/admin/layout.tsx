import Link from "next/link";

import { logout } from "@/app/(auth)/actions";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { QueenBLogo, QueensMatchMark, FloatingTopBar } from "@/components/brand-lockup";
import { UserInitialAvatar } from "@/components/user-initial-avatar";
import { requireAdminUser } from "@/lib/services/admin-authorization";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireAdminUser();

  return (
    <div className="min-h-screen bg-cream pt-3 text-ink">
      <FloatingTopBar>
        <div className="flex items-center gap-3">
          <QueensMatchMark href="/admin" />
          <nav className="flex items-center gap-2" aria-label="Admin workspace">
            <Link
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand/30"
              href="/dashboard"
            >
              Home
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <form action={logout}>
              <button
                className="rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-brand/30"
                type="submit"
              >
                Sign out
              </button>
            </form>
            <UserInitialAvatar name={user.username} />
            <QueenBLogo className="h-10 shrink-0" />
          </div>
        </div>
      </FloatingTopBar>
      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8">
        <aside className="w-48 shrink-0">
          <AdminSidebar />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

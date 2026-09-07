import Link from "next/link";

import { AdminPagination } from "@/components/admin/admin-pagination";
import { isSoleAdminEmail } from "@/lib/services/admin-authorization";
import { getAdminUsersDirectory } from "@/lib/services/admin";
import { adminUsersFilterSchema } from "@/lib/validations/admin";

type AdminUsersPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
};

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const raw = await searchParams;
  const parsed = adminUsersFilterSchema.safeParse({
    q: raw.q,
    page: raw.page ?? "1",
  });
  const filters = parsed.success ? parsed.data : { page: 1, q: undefined };
  const directory = await getAdminUsersDirectory(filters);

  return (
    <section>
      <p className="text-sm font-medium text-amber-700">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold">User directory</h1>
      <p className="mt-3 max-w-2xl text-zinc-600">
        Paginated users with emails and completed mentoring session counts.
      </p>

      <form className="mt-8 flex flex-wrap gap-3" method="get">
        <label className="text-sm text-zinc-700">
          Search
          <input
            className="ml-2 rounded-lg border border-zinc-300 px-3 py-2"
            defaultValue={filters.q ?? ""}
            name="q"
            placeholder="username or email"
            type="search"
          />
        </label>
        <button
          className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white"
          type="submit"
        >
          Search
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Roles</th>
              <th className="px-4 py-3 font-medium">Completed as mentor</th>
              <th className="px-4 py-3 font-medium">Mentee meetings</th>
            </tr>
          </thead>
          <tbody>
            {directory.users.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-zinc-600" colSpan={5}>
                  No users match this search.
                </td>
              </tr>
            ) : (
              directory.users.map((user) => (
                <tr className="border-t border-zinc-100" key={user.id}>
                  <td className="px-4 py-3">
                    <Link
                      className="font-medium text-amber-800 hover:underline"
                      href={`/admin/users/${user.id}`}
                    >
                      {user.username}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{user.email}</td>
                  <td className="px-4 py-3 text-zinc-600">
                    {[
                      user.isMentor ? "Mentor" : null,
                      isSoleAdminEmail(user.email) ? "Admin" : null,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Mentee"}
                  </td>
                  <td className="px-4 py-3">{user._count.mentorMeetings}</td>
                  <td className="px-4 py-3">{user._count.menteeMeetings}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        basePath="/admin/users"
        page={directory.page}
        pageCount={directory.pageCount}
        params={{ q: filters.q }}
      />
    </section>
  );
}

import Link from "next/link";

type AdminPaginationProps = {
  basePath: string;
  page: number;
  pageCount: number;
  params?: Record<string, string | undefined>;
};

function hrefForPage(
  basePath: string,
  page: number,
  params: Record<string, string | undefined> = {},
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }
  if (page > 1) {
    search.set("page", String(page));
  }
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function AdminPagination({
  basePath,
  page,
  pageCount,
  params,
}: AdminPaginationProps) {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <nav
      className="mt-6 flex items-center justify-between text-sm text-zinc-600"
      aria-label="Pagination"
    >
      {page > 1 ? (
        <Link
          className="rounded-lg px-3 py-2 hover:bg-zinc-100"
          href={hrefForPage(basePath, page - 1, params)}
        >
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span>
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link
          className="rounded-lg px-3 py-2 hover:bg-zinc-100"
          href={hrefForPage(basePath, page + 1, params)}
        >
          Next
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

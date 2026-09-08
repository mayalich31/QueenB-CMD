"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Metrics" },
  { href: "/admin/alerts", label: "Alerts" },
  { href: "/admin/meetings", label: "Meetings" },
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/users", label: "Users" },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1" aria-label="Admin">
      {links.map((link) => {
        const isActive =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            className={`block rounded-lg px-3 py-2 text-sm font-medium ${
              isActive
                ? "bg-brand/40 text-brand-deep"
                : "text-zinc-700 hover:bg-brand/25"
            }`}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

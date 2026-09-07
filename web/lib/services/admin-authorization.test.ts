import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/dal/users", () => ({ findUserById: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { SOLE_ADMIN_EMAIL } from "@/lib/constants/admin";

import {
  AdminAuthorizationError,
  assertSoleAdmin,
  isSoleAdminEmail,
} from "./admin-authorization";

describe("sole admin authorization", () => {
  it("allows only admin@gmail.com regardless of isAdmin", () => {
    expect(isSoleAdminEmail(SOLE_ADMIN_EMAIL)).toBe(true);
    expect(isSoleAdminEmail("  Admin@Gmail.com  ")).toBe(true);
    expect(isSoleAdminEmail("mentor@example.com")).toBe(false);
    expect(isSoleAdminEmail(null)).toBe(false);
  });

  it("rejects every other user even when they look like an admin record", () => {
    expect(() =>
      assertSoleAdmin({ email: SOLE_ADMIN_EMAIL }),
    ).not.toThrow();
    expect(() =>
      assertSoleAdmin({ email: "other@example.com" }),
    ).toThrow(AdminAuthorizationError);
    expect(() => assertSoleAdmin(null)).toThrow(AdminAuthorizationError);
  });
});

import { redirect } from "next/navigation";

import { SOLE_ADMIN_EMAIL } from "@/lib/constants/admin";
import { findUserById } from "@/lib/dal/users";
import { createClient } from "@/lib/supabase/server";

export class AdminAuthorizationError extends Error {
  constructor() {
    super("Only the platform admin can access this resource.");
    this.name = "AdminAuthorizationError";
  }
}

export function isSoleAdminEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() === SOLE_ADMIN_EMAIL;
}

export function assertSoleAdmin(user: { email: string } | null | undefined) {
  if (!user || !isSoleAdminEmail(user.email)) {
    throw new AdminAuthorizationError();
  }
}

export async function requireAdminUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) {
    redirect("/login");
  }

  const user = await findUserById(claims.sub);

  if (!user || !isSoleAdminEmail(user.email)) {
    redirect("/dashboard");
  }

  return user;
}

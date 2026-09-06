import { redirect } from "next/navigation";

import { findUserById } from "@/lib/dal/users";
import { createClient } from "@/lib/supabase/server";

export default async function MentorDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const user = await findUserById(userId);

  if (!user?.isMentor) {
    redirect("/dashboard/profile");
  }

  return children;
}

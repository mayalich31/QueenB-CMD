"use server";

import { redirect } from "next/navigation";

import { markNotificationRead } from "@/lib/services/notifications";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationReadAction(notificationId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  await markNotificationRead(userId, notificationId);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createFeedbackForUser } from "@/lib/services/feedback";
import { createClient } from "@/lib/supabase/server";

export async function submitFeedbackAction(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  const workspace =
    formData.get("workspace") === "mentor" ? "mentor" : "mentee";

  if (!userId) {
    redirect("/login");
  }

  try {
    await createFeedbackForUser(userId, {
      meetingId: formData.get("meetingId"),
      rating: Number(formData.get("rating")),
      comment: formData.get("comment") || undefined,
    });
  } catch {
    redirect(
      `/dashboard/${workspace}?error=Feedback+could+not+be+submitted.`,
    );
  }

  revalidatePath("/dashboard/mentee");
  revalidatePath("/dashboard/mentor");
  redirect(`/dashboard/${workspace}?message=Feedback+submitted.`);
}

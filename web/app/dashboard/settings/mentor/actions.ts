"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { saveMentorProfile } from "@/lib/services/mentor-profiles";
import { createClient } from "@/lib/supabase/server";
import { mentorProfileFormSchema } from "@/lib/validations/mentor-profile";

export async function saveMentorProfileAction(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const result = mentorProfileFormSchema.safeParse({
    background: formData.get("background"),
    topics: formData.getAll("topics"),
    maxConcurrentMeetings: Number(formData.get("maxConcurrentMeetings")),
    meetingDurationMinutes: Number(formData.get("meetingDurationMinutes")),
    isActive: formData.get("isActive") === "on",
  });

  if (!result.success) {
    const error =
      result.error.issues[0]?.message ?? "The mentor profile is invalid.";
    const searchParams = new URLSearchParams({ error });
    redirect(`/dashboard/settings/mentor?${searchParams.toString()}`);
  }

  await saveMentorProfile(userId, result.data);
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/mentee/directory");

  const searchParams = new URLSearchParams({
    message: "Mentor profile saved.",
  });
  redirect(`/dashboard/settings/mentor?${searchParams.toString()}`);
}

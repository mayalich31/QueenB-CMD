"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { FeedbackEnforcementError } from "@/lib/services/enforcement";
import { createFeedbackForUser } from "@/lib/services/feedback";
import {
  MeetingRequestError,
  requestMeetingForMentee,
} from "@/lib/services/meetings";
import { createClient } from "@/lib/supabase/server";

export async function requestMeetingAction(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const menteeId = data?.claims?.sub;

  if (!menteeId) {
    redirect("/login");
  }

  const mentorId = formData.get("mentorId");

  if (typeof mentorId !== "string") {
    redirect("/dashboard?error=Invalid+mentor.");
  }

  let errorMessage: string | undefined;

  try {
    await requestMeetingForMentee(menteeId, mentorId);
  } catch (error) {
    errorMessage =
      error instanceof MeetingRequestError ||
      error instanceof FeedbackEnforcementError
        ? error.message
        : "The meeting request could not be created.";
  }

  if (errorMessage) {
    const searchParams = new URLSearchParams({ error: errorMessage });
    redirect(`/dashboard?${searchParams.toString()}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/mentor");
  redirect("/dashboard?message=Meeting+request+sent.");
}

export async function submitFeedbackAction(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  const workspace =
    formData.get("workspace") === "mentor" ? "mentor" : "profile";

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

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/mentor");
  redirect(`/dashboard/${workspace}?message=Feedback+submitted.`);
}

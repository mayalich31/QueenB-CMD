"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  MeetingRequestError,
  rejectMeetingRequest,
} from "@/lib/services/meetings";
import { createClient } from "@/lib/supabase/server";

export async function rejectMeetingRequestAction(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const mentorId = data?.claims?.sub;

  if (!mentorId) {
    redirect("/login");
  }

  const meetingId = formData.get("meetingId");

  if (typeof meetingId !== "string") {
    redirect("/dashboard/mentor?error=Invalid+meeting.");
  }

  let errorMessage: string | undefined;

  try {
    await rejectMeetingRequest(mentorId, meetingId);
  } catch (error) {
    errorMessage =
      error instanceof MeetingRequestError
        ? error.message
        : "The meeting request could not be rejected.";
  }

  if (errorMessage) {
    const searchParams = new URLSearchParams({ error: errorMessage });
    redirect(`/dashboard/mentor?${searchParams.toString()}`);
  }

  revalidatePath("/dashboard/mentor");
  revalidatePath("/dashboard/mentee");
  revalidatePath("/dashboard/mentee/directory");

  const searchParams = new URLSearchParams({
    message: "Meeting request rejected.",
  });
  redirect(`/dashboard/mentor?${searchParams.toString()}`);
}

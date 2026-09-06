"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
    redirect("/dashboard/mentee/directory?error=Invalid+mentor.");
  }

  let errorMessage: string | undefined;

  try {
    await requestMeetingForMentee(menteeId, mentorId);
  } catch (error) {
    errorMessage =
      error instanceof MeetingRequestError
        ? error.message
        : "The meeting request could not be created.";
  }

  if (errorMessage) {
    const searchParams = new URLSearchParams({ error: errorMessage });
    redirect(`/dashboard/mentee/directory?${searchParams.toString()}`);
  }

  revalidatePath("/dashboard/mentee");
  revalidatePath("/dashboard/mentee/directory");
  revalidatePath("/dashboard/mentor");

  const searchParams = new URLSearchParams({
    message: "Meeting request sent.",
  });
  redirect(`/dashboard/mentee/directory?${searchParams.toString()}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  requestMoreMeetingTimes,
  selectMeetingSlotForMentee,
} from "@/lib/services/meetings";
import { createClient } from "@/lib/supabase/server";

async function authenticatedMenteeId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub;
}

export async function selectMeetingSlotAction(formData: FormData) {
  const menteeId = await authenticatedMenteeId();
  const meetingId = formData.get("meetingId");
  const slotId = formData.get("slotId");

  if (!menteeId) {
    redirect("/login");
  }

  try {
    await selectMeetingSlotForMentee(menteeId, { meetingId, slotId });
  } catch {
    redirect("/dashboard/mentee?error=The+meeting+time+could+not+be+selected.");
  }

  revalidatePath("/dashboard/mentee");
  revalidatePath("/dashboard/mentor");
  redirect("/dashboard/mentee?message=Meeting+scheduled.");
}

export async function requestMoreTimesAction(formData: FormData) {
  const menteeId = await authenticatedMenteeId();
  const meetingId = formData.get("meetingId");

  if (!menteeId) {
    redirect("/login");
  }

  if (typeof meetingId !== "string") {
    redirect("/dashboard/mentee?error=Invalid+meeting.");
  }

  try {
    await requestMoreMeetingTimes(menteeId, meetingId);
  } catch {
    redirect(
      "/dashboard/mentee?error=Additional+times+could+not+be+requested.",
    );
  }

  revalidatePath("/dashboard/mentee");
  revalidatePath("/dashboard/mentor");
  redirect("/dashboard/mentee?message=Additional+times+requested.");
}

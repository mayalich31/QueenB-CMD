"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { findMentorProfile } from "@/lib/dal/mentor-profiles";
import {
  confirmMeetingAttendance,
  MeetingRequestError,
  proposeMeetingSlotsForMentor,
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

export async function proposeMeetingSlotsAction(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const mentorId = data?.claims?.sub;

  if (!mentorId) {
    redirect("/login");
  }

  const meetingId = formData.get("meetingId");
  const startsAt = formData
    .getAll("startsAt")
    .filter((value): value is string => typeof value === "string" && !!value);
  const profile = await findMentorProfile(mentorId);

  if (typeof meetingId !== "string" || !profile) {
    redirect("/dashboard/mentor?error=Invalid+meeting+proposal.");
  }

  const slots = startsAt.map((value) => {
    const startsAtDate = new Date(value);
    return {
      startsAt: startsAtDate,
      endsAt: new Date(
        startsAtDate.getTime() + profile.meetingDurationMinutes * 60_000,
      ),
    };
  });

  let errorMessage: string | undefined;

  try {
    await proposeMeetingSlotsForMentor(mentorId, { meetingId, slots });
  } catch (error) {
    errorMessage =
      error instanceof MeetingRequestError
        ? error.message
        : "The time options could not be saved.";
  }

  if (errorMessage) {
    const searchParams = new URLSearchParams({ error: errorMessage });
    redirect(`/dashboard/mentor?${searchParams.toString()}`);
  }

  revalidatePath("/dashboard/mentor");
  revalidatePath("/dashboard/mentee");
  redirect("/dashboard/mentor?message=Time+options+sent.");
}

export async function confirmAttendanceAction(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const mentorId = data?.claims?.sub;
  const meetingId = formData.get("meetingId");

  if (!mentorId) {
    redirect("/login");
  }

  if (typeof meetingId !== "string") {
    redirect("/dashboard/mentor?error=Invalid+meeting.");
  }

  try {
    await confirmMeetingAttendance(mentorId, meetingId);
  } catch {
    redirect("/dashboard/mentor?error=Attendance+could+not+be+confirmed.");
  }

  revalidatePath("/dashboard/mentor");
  revalidatePath("/dashboard/mentee");
  redirect("/dashboard/mentor?message=Attendance+confirmed.");
}

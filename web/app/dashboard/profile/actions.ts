"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { saveMentorProfile } from "@/lib/services/mentor-profiles";
import { updateUser } from "@/lib/services/users";
import {
  cancelMeetingForParticipant,
  confirmMeetingAttendanceForParticipant,
  requestMoreMeetingTimes,
  selectMeetingSlotForMentee,
} from "@/lib/services/meetings";
import { createClient } from "@/lib/supabase/server";
import { mentorProfileFormSchema } from "@/lib/validations/mentor-profile";
import {
  parseOptionalProfileFormData,
  userProfileUpdateSchema,
} from "@/lib/validations/user";
import { findMentorProfile } from "@/lib/dal/mentor-profiles";

async function authenticatedUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub;
}

function profileError(message: string): never {
  const searchParams = new URLSearchParams({ error: message });
  redirect(`/dashboard/profile?${searchParams.toString()}`);
}

function profileSuccess(message: string): never {
  const searchParams = new URLSearchParams({ message });
  redirect(`/dashboard/profile?${searchParams.toString()}`);
}

function revalidateMeetingViews() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/mentor");
  revalidatePath("/meetings", "layout");
}

export async function selectMeetingSlotAction(formData: FormData) {
  const userId = await authenticatedUserId();

  if (!userId) {
    redirect("/login");
  }

  try {
    await selectMeetingSlotForMentee(userId, {
      meetingId: formData.get("meetingId"),
      slotId: formData.get("slotId"),
    });
  } catch {
    profileError("The meeting time could not be selected.");
  }

  revalidateMeetingViews();
  profileSuccess("Meeting scheduled.");
}

export async function requestMoreTimesAction(formData: FormData) {
  const userId = await authenticatedUserId();
  const meetingId = formData.get("meetingId");

  if (!userId) {
    redirect("/login");
  }

  if (typeof meetingId !== "string") {
    profileError("Invalid meeting.");
  }

  try {
    await requestMoreMeetingTimes(userId, meetingId);
  } catch {
    profileError("Additional times could not be requested.");
  }

  revalidateMeetingViews();
  profileSuccess("Additional times requested.");
}

export async function confirmAttendanceAction(formData: FormData) {
  const userId = await authenticatedUserId();
  const meetingId = formData.get("meetingId");

  if (!userId) {
    redirect("/login");
  }

  if (typeof meetingId !== "string") {
    profileError("Invalid meeting.");
  }

  try {
    await confirmMeetingAttendanceForParticipant(userId, meetingId);
  } catch {
    profileError("Attendance could not be confirmed.");
  }

  revalidateMeetingViews();
  profileSuccess("Your attendance confirmation was saved.");
}

export async function cancelMeetingAction(formData: FormData) {
  const userId = await authenticatedUserId();
  const meetingId = formData.get("meetingId");

  if (!userId) {
    redirect("/login");
  }

  if (typeof meetingId !== "string") {
    profileError("Invalid meeting.");
  }

  try {
    await cancelMeetingForParticipant(userId, meetingId);
  } catch {
    profileError("The meeting could not be cancelled.");
  }

  revalidateMeetingViews();
  profileSuccess("Meeting cancelled.");
}

export async function saveMentorProfileAction(formData: FormData) {
  const userId = await authenticatedUserId();

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
    profileError(
      result.error.issues[0]?.message ?? "The mentor profile is invalid.",
    );
  }

  const alreadyMentor = Boolean(await findMentorProfile(userId));
  await saveMentorProfile(userId, result.data);
  revalidateMeetingViews();
  profileSuccess(
    alreadyMentor
      ? "Mentor profile saved."
      : "You are now a mentor. Mentor details appear when you edit your profile.",
  );
}

export async function saveUserProfileAction(formData: FormData) {
  const userId = await authenticatedUserId();

  if (!userId) {
    redirect("/login");
  }

  const result = userProfileUpdateSchema.safeParse(
    parseOptionalProfileFormData(formData),
  );

  if (!result.success) {
    profileError(
      result.error.issues[0]?.message ?? "The profile details are invalid.",
    );
  }

  await updateUser(userId, result.data);
  revalidateMeetingViews();
  profileSuccess("Profile details saved.");
}

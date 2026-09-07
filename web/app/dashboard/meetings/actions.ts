"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  answerMeetingOutcomeForParticipant,
  answerMeetingRescheduleIntentForParticipant,
} from "@/lib/services/meetings";
import { createClient } from "@/lib/supabase/server";

function workspacePath(workspace: FormDataEntryValue | null) {
  return workspace === "mentor" ? "/dashboard/mentor" : "/dashboard/profile";
}

async function authenticatedUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub;
}

function revalidateMeetingViews() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/mentor");
  revalidatePath("/meetings", "layout");
}

function redirectWithMessage(
  workspace: FormDataEntryValue | null,
  key: "error" | "message",
  value: string,
): never {
  const searchParams = new URLSearchParams({ [key]: value });
  redirect(`${workspacePath(workspace)}?${searchParams.toString()}`);
}

export async function answerMeetingOutcomeAction(formData: FormData) {
  const userId = await authenticatedUserId();
  const meetingId = formData.get("meetingId");
  const didHappen = formData.get("didHappen");

  if (!userId) {
    redirect("/login");
  }

  if (typeof meetingId !== "string" || (didHappen !== "true" && didHappen !== "false")) {
    redirectWithMessage(formData.get("workspace"), "error", "Invalid meeting outcome.");
  }

  try {
    await answerMeetingOutcomeForParticipant(userId, {
      meetingId,
      didHappen: didHappen === "true",
    });
  } catch {
    redirectWithMessage(
      formData.get("workspace"),
      "error",
      "The meeting outcome could not be saved.",
    );
  }

  revalidateMeetingViews();
  redirectWithMessage(
    formData.get("workspace"),
    "message",
    "Your meeting outcome was saved.",
  );
}

export async function answerMeetingRescheduleIntentAction(formData: FormData) {
  const userId = await authenticatedUserId();
  const meetingId = formData.get("meetingId");
  const wantsReschedule = formData.get("wantsReschedule");

  if (!userId) {
    redirect("/login");
  }

  if (
    typeof meetingId !== "string" ||
    (wantsReschedule !== "true" && wantsReschedule !== "false")
  ) {
    redirectWithMessage(
      formData.get("workspace"),
      "error",
      "Invalid reschedule answer.",
    );
  }

  try {
    await answerMeetingRescheduleIntentForParticipant(userId, {
      meetingId,
      wantsReschedule: wantsReschedule === "true",
    });
  } catch {
    redirectWithMessage(
      formData.get("workspace"),
      "error",
      "The reschedule answer could not be saved.",
    );
  }

  revalidateMeetingViews();
  redirectWithMessage(
    formData.get("workspace"),
    "message",
    wantsReschedule === "true"
      ? "Your reschedule preference was saved."
      : "The meeting was marked as not completed.",
  );
}

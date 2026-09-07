import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { MeetingControlRoom } from "@/components/meetings/meeting-control-room";
import { MeetingAuthorizationError } from "@/lib/services/meeting-authorization";
import {
  getMeetingForParticipant,
  MeetingNotFoundError,
} from "@/lib/services/meetings";
import { createClient } from "@/lib/supabase/server";

type MeetingPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MeetingPage({ params }: MeetingPageProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const { id } = await params;
  const meeting = await loadMeeting(userId, id);

  if (!meeting) {
    notFound();
  }

  const backHref =
    meeting.mentorId === userId ? "/dashboard/mentor" : "/dashboard/profile";

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-zinc-50 px-4 py-8 text-zinc-950">
      <Link className="text-sm font-medium text-amber-800 hover:underline" href={backHref}>
        Back to workspace
      </Link>
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
        <MeetingControlRoom meeting={meeting} userId={userId} />
      </div>
    </main>
  );
}

async function loadMeeting(userId: string, meetingId: string) {
  try {
    return await getMeetingForParticipant(userId, meetingId);
  } catch (error) {
    if (
      error instanceof MeetingNotFoundError ||
      error instanceof MeetingAuthorizationError
    ) {
      return null;
    }
    throw error;
  }
}

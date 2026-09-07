import { notFound, redirect } from "next/navigation";

import { MeetingControlRoom } from "@/components/meetings/meeting-control-room";
import { MeetingDrawer } from "@/components/meetings/meeting-drawer";
import { MeetingAuthorizationError } from "@/lib/services/meeting-authorization";
import {
  getMeetingForParticipant,
  MeetingNotFoundError,
} from "@/lib/services/meetings";
import { createClient } from "@/lib/supabase/server";

type InterceptedMeetingPageProps = {
  params: Promise<{ id: string }>;
};

export default async function InterceptedMeetingPage({
  params,
}: InterceptedMeetingPageProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const { id } = await params;
  let meeting;

  try {
    meeting = await getMeetingForParticipant(userId, id);
  } catch (error) {
    if (
      error instanceof MeetingNotFoundError ||
      error instanceof MeetingAuthorizationError
    ) {
      notFound();
    }
    throw error;
  }

  return (
    <MeetingDrawer>
      <MeetingControlRoom meeting={meeting} userId={userId} />
    </MeetingDrawer>
  );
}

import { redirect } from "next/navigation";

import {
  MentorDirectory,
  type MentorDirectorySearchParams,
} from "@/components/mentors/mentor-directory";
import { getFeedbackEnforcementState } from "@/lib/services/enforcement";
import { createClient } from "@/lib/supabase/server";

type DashboardPageProps = {
  searchParams: Promise<MentorDirectorySearchParams>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const [params, enforcement] = await Promise.all([
    searchParams,
    getFeedbackEnforcementState(userId),
  ]);

  return (
    <MentorDirectory
      currentUserId={userId}
      isSoftBlocked={enforcement.isSoftBlocked}
      searchParams={params}
    />
  );
}

import { authorizeCronRequest } from "@/lib/api/verify-cron-secret";
import { runMeetingCompletionJob } from "@/lib/services/cron-jobs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runMeetingCompletionJob();
  return Response.json({ ok: true, ...result });
}

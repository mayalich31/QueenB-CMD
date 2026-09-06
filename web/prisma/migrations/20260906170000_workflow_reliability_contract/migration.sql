-- Add durable completion timestamps before backfilling historical records.
ALTER TABLE "Meeting"
ADD COLUMN "completedAt" TIMESTAMPTZ(3);

UPDATE "Meeting"
SET "completedAt" = COALESCE("scheduledAt", "updatedAt")
WHERE "status" = 'COMPLETED';

CREATE TYPE "NotificationType" AS ENUM (
  'MEETING_REQUESTED',
  'MEETING_SLOTS_PROPOSED',
  'MEETING_SCHEDULED',
  'MEETING_ATTENDANCE_CONFIRMED',
  'MEETING_CANCELLED',
  'MEETING_COMPLETED',
  'MEETING_VERIFICATION_REQUIRED',
  'MEETING_RESCHEDULED',
  'FEEDBACK_REMINDER'
);

CREATE TABLE "MeetingVerification" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "meetingId" UUID NOT NULL,
  "cycle" SMALLINT NOT NULL,
  "mentorDidHappen" BOOLEAN,
  "menteeDidHappen" BOOLEAN,
  "mentorWantsReschedule" BOOLEAN,
  "menteeWantsReschedule" BOOLEAN,
  "verificationResolvedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "MeetingVerification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MeetingVerification_cycle_check" CHECK ("cycle" IN (0, 1)),
  CONSTRAINT "MeetingVerification_retry_answers_check" CHECK (
    (
      "mentorWantsReschedule" IS NULL
      AND "menteeWantsReschedule" IS NULL
    )
    OR (
      "mentorDidHappen" IS NOT NULL
      AND "menteeDidHappen" IS NOT NULL
      AND NOT ("mentorDidHappen" AND "menteeDidHappen")
    )
  ),
  CONSTRAINT "MeetingVerification_resolution_check" CHECK (
    "verificationResolvedAt" IS NULL
    OR (
      "mentorDidHappen" = true
      AND "menteeDidHappen" = true
    )
    OR (
      "mentorDidHappen" IS NOT NULL
      AND "menteeDidHappen" IS NOT NULL
      AND (
        "cycle" = 1
        OR "mentorWantsReschedule" = false
        OR "menteeWantsReschedule" = false
        OR (
          "mentorWantsReschedule" = true
          AND "menteeWantsReschedule" = true
        )
      )
    )
  )
);

CREATE TABLE "Notification" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "meetingId" UUID,
  "type" "NotificationType" NOT NULL,
  "href" TEXT,
  "readAt" TIMESTAMPTZ(3),
  "dedupeKey" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MeetingVerification"
ADD CONSTRAINT "MeetingVerification_meetingId_fkey"
FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_meetingId_fkey"
FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "MeetingVerification_meetingId_cycle_key"
ON "MeetingVerification"("meetingId", "cycle");

CREATE INDEX "MeetingVerification_verificationResolvedAt_idx"
ON "MeetingVerification"("verificationResolvedAt");

CREATE UNIQUE INDEX "Notification_dedupeKey_key"
ON "Notification"("dedupeKey");

CREATE INDEX "Notification_userId_readAt_createdAt_idx"
ON "Notification"("userId", "readAt", "createdAt");

CREATE INDEX "Notification_meetingId_idx"
ON "Notification"("meetingId");

CREATE INDEX "Meeting_status_completedAt_idx"
ON "Meeting"("status", "completedAt");

ALTER TABLE "Meeting"
ADD CONSTRAINT "Meeting_completion_timestamp_check"
CHECK (
  ("status" = 'COMPLETED' AND "completedAt" IS NOT NULL)
  OR "status" = 'NOT_COMPLETED'
  OR (
    "status" NOT IN ('COMPLETED', 'NOT_COMPLETED')
    AND "completedAt" IS NULL
  )
);

ALTER TABLE "Meeting"
DROP CONSTRAINT "Meeting_confirmation_state_check";

ALTER TABLE "Meeting"
ADD CONSTRAINT "Meeting_confirmation_state_check"
CHECK (
  (
    "mentorAttendanceConfirmedAt" IS NULL
    AND "menteeAttendanceConfirmedAt" IS NULL
  )
  OR "status" IN (
    'SCHEDULED',
    'ATTENDANCE_CONFIRMED',
    'COMPLETED',
    'NOT_COMPLETED'
  )
);

CREATE FUNCTION "check_meeting_verification_cycle"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."cycle" = 1 AND NOT EXISTS (
    SELECT 1
    FROM "Meeting"
    WHERE "id" = NEW."meetingId"
      AND "hasRescheduled" = true
  ) THEN
    RAISE EXCEPTION
      'Meeting verification cycle 1 requires a rescheduled meeting';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "MeetingVerification_cycle_invariant"
BEFORE INSERT OR UPDATE OF "meetingId", "cycle"
ON "MeetingVerification"
FOR EACH ROW
EXECUTE FUNCTION "check_meeting_verification_cycle"();

-- Existing completed meetings predate bilateral verification. Preserve them as
-- jointly verified cycle-zero records so feedback behavior remains unchanged.
INSERT INTO "MeetingVerification" (
  "id",
  "meetingId",
  "cycle",
  "mentorDidHappen",
  "menteeDidHappen",
  "verificationResolvedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  "id",
  0,
  true,
  true,
  "completedAt",
  "completedAt",
  "completedAt"
FROM "Meeting"
WHERE "status" = 'COMPLETED'
ON CONFLICT ("meetingId", "cycle") DO NOTHING;

ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_select_own" ON "Notification";
CREATE POLICY "notification_select_own"
ON "Notification"
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = "userId");

GRANT SELECT ON TABLE "Notification" TO authenticated;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = current_schema()
      AND tablename = 'Notification'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";
  END IF;
END
$$;

ALTER TABLE "Meeting"
ADD COLUMN "mentorAttendanceConfirmedAt" TIMESTAMPTZ(3),
ADD COLUMN "menteeAttendanceConfirmedAt" TIMESTAMPTZ(3);

-- Preserve existing confirmed/completed records as approvals by both parties.
UPDATE "Meeting"
SET
  "mentorAttendanceConfirmedAt" = COALESCE("scheduledAt", "updatedAt"),
  "menteeAttendanceConfirmedAt" = COALESCE("scheduledAt", "updatedAt")
WHERE "status" IN ('ATTENDANCE_CONFIRMED', 'COMPLETED');

ALTER TABLE "Meeting"
ADD CONSTRAINT "Meeting_dual_attendance_confirmation_check"
CHECK (
  "status" NOT IN ('ATTENDANCE_CONFIRMED', 'COMPLETED')
  OR (
    "mentorAttendanceConfirmedAt" IS NOT NULL
    AND "menteeAttendanceConfirmedAt" IS NOT NULL
  )
);

ALTER TABLE "Meeting"
ADD CONSTRAINT "Meeting_confirmation_state_check"
CHECK (
  (
    "mentorAttendanceConfirmedAt" IS NULL
    AND "menteeAttendanceConfirmedAt" IS NULL
  )
  OR "status" IN ('SCHEDULED', 'ATTENDANCE_CONFIRMED', 'COMPLETED')
);

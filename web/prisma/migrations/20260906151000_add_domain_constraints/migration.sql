-- Prevent self-matches even when data is written outside the application.
ALTER TABLE "Meeting"
ADD CONSTRAINT "Meeting_distinct_participants_check"
CHECK ("menteeId" <> "mentorId");

-- A mentee can have only one active match with the same mentor.
CREATE UNIQUE INDEX "Meeting_one_active_pair_key"
ON "Meeting" ("menteeId", "mentorId")
WHERE "status" IN (
  'WAITING_FOR_MENTOR_TIMES',
  'WAITING_FOR_MENTEE_SELECTION',
  'SCHEDULED',
  'ATTENDANCE_CONFIRMED'
);

-- States after slot selection must retain their scheduled timestamp.
ALTER TABLE "Meeting"
ADD CONSTRAINT "Meeting_scheduled_status_time_check"
CHECK (
  "status" NOT IN ('SCHEDULED', 'ATTENDANCE_CONFIRMED', 'COMPLETED')
  OR "scheduledAt" IS NOT NULL
);

ALTER TABLE "MeetingSlot"
ADD CONSTRAINT "MeetingSlot_positive_duration_check"
CHECK ("endsAt" > "startsAt");

-- At most one slot can be selected for a meeting.
CREATE UNIQUE INDEX "MeetingSlot_one_selected_key"
ON "MeetingSlot" ("meetingId")
WHERE "isSelected" = true;

ALTER TABLE "Feedback"
ADD CONSTRAINT "Feedback_rating_range_check"
CHECK ("rating" BETWEEN 1 AND 5);

ALTER TABLE "Feedback"
ADD CONSTRAINT "Feedback_comment_length_check"
CHECK ("comment" IS NULL OR char_length("comment") <= 2000);

ALTER TABLE "MentorProfile"
ADD CONSTRAINT "MentorProfile_capacity_range_check"
CHECK ("maxConcurrentMeetings" BETWEEN 1 AND 100);

ALTER TABLE "MentorProfile"
ADD CONSTRAINT "MentorProfile_duration_range_check"
CHECK ("meetingDurationMinutes" BETWEEN 15 AND 240);

ALTER TABLE "MentorProfile"
ADD CONSTRAINT "MentorProfile_topics_count_check"
CHECK (cardinality("topics") BETWEEN 1 AND 20);

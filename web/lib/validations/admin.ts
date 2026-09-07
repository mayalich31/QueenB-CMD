import { z } from "zod";

import { MeetingStatus } from "@/lib/generated/prisma/enums";

const meetingStatusValues = Object.values(MeetingStatus) as [
  MeetingStatus,
  ...MeetingStatus[],
];

const optionalSearch = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((value) => value || undefined);

export const adminMeetingsFilterSchema = z.object({
  status: z.enum(meetingStatusValues).optional(),
  participant: optionalSearch,
  page: z.coerce.number().int().min(1).default(1),
});

export const adminUsersFilterSchema = z.object({
  q: optionalSearch,
  page: z.coerce.number().int().min(1).default(1),
});

export const adminCalendarMonthSchema = z
  .object({
    month: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
      .optional(),
  })
  .transform(({ month }) => {
    if (!month) {
      const now = new Date();
      return {
        year: now.getUTCFullYear(),
        month: now.getUTCMonth() + 1,
      };
    }

    const [year, monthNumber] = month.split("-").map(Number);
    return { year, month: monthNumber };
  });

export type AdminMeetingsFilterInput = z.infer<typeof adminMeetingsFilterSchema>;
export type AdminUsersFilterInput = z.infer<typeof adminUsersFilterSchema>;
export type AdminCalendarMonthInput = z.infer<typeof adminCalendarMonthSchema>;

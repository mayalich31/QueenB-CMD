import {
  createMentorProfile as createMentorProfileRecord,
  updateMentorProfile as updateMentorProfileRecord,
} from "@/lib/dal/mentor-profiles";
import {
  mentorProfileCreateSchema,
  mentorProfileUpdateSchema,
} from "@/lib/validations/mentor-profile";

export function createMentorProfile(input: unknown) {
  const data = mentorProfileCreateSchema.parse(input);
  return createMentorProfileRecord(data);
}

export function updateMentorProfile(userId: string, input: unknown) {
  const data = mentorProfileUpdateSchema.parse(input);
  return updateMentorProfileRecord(userId, data);
}

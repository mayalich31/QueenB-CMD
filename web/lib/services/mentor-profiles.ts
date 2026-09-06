import {
  createMentorProfile as createMentorProfileRecord,
  findMentorProfile,
  listAvailableMentors,
  updateMentorProfile as updateMentorProfileRecord,
} from "@/lib/dal/mentor-profiles";
import {
  mentorDirectoryFilterSchema,
  mentorProfileCreateSchema,
  mentorProfileFormSchema,
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

export async function saveMentorProfile(userId: string, input: unknown) {
  const data = mentorProfileFormSchema.parse(input);
  const existingProfile = await findMentorProfile(userId);

  if (existingProfile) {
    return updateMentorProfileRecord(userId, data);
  }

  return createMentorProfileRecord({ ...data, userId });
}

export function listMentors(input: unknown, excludeUserId?: string) {
  const { topics } = mentorDirectoryFilterSchema.parse(input);
  return listAvailableMentors({ topics, excludeUserId });
}

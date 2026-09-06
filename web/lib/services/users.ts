import {
  createUser as createUserRecord,
  updateUser as updateUserRecord,
} from "@/lib/dal/users";
import {
  userCreateSchema,
  userUpdateSchema,
} from "@/lib/validations/user";

export function createUser(input: unknown) {
  const data = userCreateSchema.parse(input);
  return createUserRecord(data);
}

export function updateUser(id: string, input: unknown) {
  const data = userUpdateSchema.parse(input);
  return updateUserRecord(id, data);
}

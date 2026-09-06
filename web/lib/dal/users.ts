import { prisma } from "@/lib/prisma";
import type {
  UserCreateInput,
  UserUpdateInput,
} from "@/lib/validations/user";

export function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { mentorProfile: true },
  });
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export function findUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
  });
}

export function createUser(data: UserCreateInput) {
  return prisma.user.create({ data });
}

export function updateUser(id: string, data: UserUpdateInput) {
  return prisma.user.update({
    where: { id },
    data,
  });
}

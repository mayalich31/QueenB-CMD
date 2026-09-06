import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(30, "Username must be at most 30 characters.")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Username may only contain letters, numbers, underscores, and hyphens.",
  );

export const userCreateSchema = z.object({
  id: z.uuid({ error: "User ID must be a valid UUID." }),
  email: z
    .string()
    .trim()
    .pipe(z.email({ error: "Email must be valid." }).max(254)),
  username: usernameSchema,
});

export const userUpdateSchema = userCreateSchema
  .pick({
    email: true,
    username: true,
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one user field must be provided.",
  });

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

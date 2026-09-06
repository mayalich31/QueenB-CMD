"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { findUserByUsername } from "@/lib/dal/users";
import { createClient } from "@/lib/supabase/server";
import { createUser } from "@/lib/services/users";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

function messageUrl(
  path: string,
  kind: "error" | "message",
  message: string,
) {
  const searchParams = new URLSearchParams({ [kind]: message });
  return `${path}?${searchParams.toString()}`;
}

function firstValidationError(error: {
  issues: Array<{ message: string }>;
}) {
  return error.issues[0]?.message ?? "The submitted values are invalid.";
}

export async function login(formData: FormData) {
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    redirect(
      messageUrl("/login", "error", firstValidationError(result.error)),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    redirect(messageUrl("/login", "error", "Invalid email or password."));
  }

  revalidatePath("/", "layout");
  redirect("/dashboard/mentee");
}

export async function register(formData: FormData) {
  const result = registerSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!result.success) {
    redirect(
      messageUrl("/register", "error", firstValidationError(result.error)),
    );
  }

  const existingUsername = await findUserByUsername(result.data.username);

  if (existingUsername) {
    redirect(
      messageUrl("/register", "error", "That username is already in use."),
    );
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: { username: result.data.username },
      ...(origin
        ? { emailRedirectTo: `${origin}/auth/callback?next=/dashboard/mentee` }
        : {}),
    },
  });

  if (error || !data.user) {
    redirect(
      messageUrl(
        "/register",
        "error",
        error?.message ?? "Unable to create the account.",
      ),
    );
  }

  let profileCreated = false;

  try {
    await createUser({
      id: data.user.id,
      email: result.data.email,
      username: result.data.username,
    });
    profileCreated = true;
  } catch {
    await supabase.auth.signOut();
  }

  if (!profileCreated) {
    redirect(
      messageUrl(
        "/register",
        "error",
        "The authentication account was created, but the profile could not be initialized. Contact support before retrying.",
      ),
    );
  }

  if (!data.session) {
    redirect(
      messageUrl(
        "/login",
        "message",
        "Check your email to confirm your account, then sign in.",
      ),
    );
  }

  revalidatePath("/", "layout");
  redirect("/dashboard/mentee");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

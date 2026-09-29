"use server";

import { redirect, RedirectType } from "next/navigation";

import { createAuthSupabaseClient } from "@/lib/supabase/auth";
import { hasActiveAdminMembership } from "@/lib/admin/membership";
import { adminReturnPath } from "./return-path";

const LOGIN_ERROR = "Не удалось выполнить вход. Проверьте данные и попробуйте снова.";

export type LoginState = { error: string | null };

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");
  if (
    typeof rawEmail !== "string" ||
    typeof rawPassword !== "string" ||
    !rawEmail.trim() ||
    !rawPassword ||
    rawEmail.length > 320 ||
    rawPassword.length > 1024
  ) {
    return { error: LOGIN_ERROR };
  }

  const client = await createAuthSupabaseClient();
  let allowed = false;
  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: rawEmail.trim(),
      password: rawPassword,
    });
    if (!error && data.user) {
      const verified = await client.auth.getUser();
      if (!verified.error && verified.data.user?.id === data.user.id) {
        allowed = await hasActiveAdminMembership(client, data.user.id);
      }
    }
  } catch {
    // Auth and membership failures have the same public result; never log credentials.
  }

  if (!allowed) {
    try {
      await client.auth.signOut({ scope: "local" });
    } catch {
      // Fail closed even if the Auth service cannot revoke a failed attempt.
    }
    return { error: LOGIN_ERROR };
  }

  redirect(adminReturnPath(formData.get("next")), RedirectType.replace);
}

/** Future Admin shell can bind this action to a POST form. */
export async function logoutAction() {
  const client = await createAuthSupabaseClient();
  const { error } = await client.auth.signOut({ scope: "local" });
  if (error) throw new Error("Не удалось завершить сеанс. Попробуйте снова.");
  redirect("/admin/login", RedirectType.replace);
}

/** The login page uses this only for an existing Auth account without active membership. */
export async function clearNonAdminLoginSession() {
  const client = await createAuthSupabaseClient();
  await client.auth.signOut({ scope: "local" });
}

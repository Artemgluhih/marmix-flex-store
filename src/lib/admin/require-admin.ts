import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { adminReturnPath } from "@/app/admin/login/return-path";
import { createAuthSupabaseClient } from "@/lib/supabase/auth";
import { hasActiveAdminMembership } from "./membership";
import { isSameOriginMutationRequest } from "./same-origin";

type AuthClient = Awaited<ReturnType<typeof createAuthSupabaseClient>>;
export type AdminContext = { userId: string; supabase: AuthClient };

async function verifyCurrentAdmin(): Promise<
  | { kind: "allowed"; context: AdminContext }
  | { kind: "unauthenticated" }
  | { kind: "not-admin"; supabase: AuthClient }
> {
  noStore();
  try {
    const supabase = await createAuthSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return { kind: "unauthenticated" };
    if (!(await hasActiveAdminMembership(supabase, data.user.id))) {
      return { kind: "not-admin", supabase };
    }
    return { kind: "allowed", context: { userId: data.user.id, supabase } };
  } catch {
    return { kind: "unauthenticated" };
  }
}

/** Use before every private server read, independently of the workspace layout. */
export async function requireAdmin(returnPath: string = "/admin"): Promise<AdminContext> {
  const result = await verifyCurrentAdmin();
  if (result.kind === "allowed") return result.context;

  // The login page is outside the workspace layout. Its existing POST action clears
  // a valid non-admin session; a Server Component cannot reliably write cookies.
  const next = adminReturnPath(returnPath);
  redirect(`/admin/login?next=${encodeURIComponent(next)}`);
}

/** Start every future Admin Server Action or mutation Route Handler with this guard. */
export async function requireAdminMutation(): Promise<AdminContext> {
  if (!isSameOriginMutationRequest(await headers())) redirect("/admin/login");

  const result = await verifyCurrentAdmin();
  if (result.kind === "allowed") return result.context;
  if (result.kind === "not-admin") {
    try {
      await result.supabase.auth.signOut({ scope: "local" });
    } catch {
      // The mutation is denied even if session clearing fails.
    }
  }
  // Next handles redirects in both Server Actions and Route Handlers without
  // exposing an authorization reason or producing a generic 500 response.
  redirect("/admin/login");
}

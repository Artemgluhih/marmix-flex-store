import "server-only";

import type { createAuthSupabaseClient } from "@/lib/supabase/auth";

type AuthClient = Awaited<ReturnType<typeof createAuthSupabaseClient>>;

/** Login-specific own-row check under the authenticated user's JWT and T017 RLS. */
export async function hasActiveLoginMembership(client: AuthClient, userId: string) {
  const { data, error } = await client
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  return !error && data?.user_id === userId;
}

import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSecretSupabaseConfig } from "./env";

/** Reserved for the future server-side public order endpoint; never use for Admin. */
export function createOrderSecretSupabaseClient() {
  const { url, secretKey } = getSecretSupabaseConfig();

  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

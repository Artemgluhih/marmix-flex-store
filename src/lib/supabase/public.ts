import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getPublicSupabaseConfig } from "./env";

/** Guest catalog reads only; no cookies, session adapter, or user JWT. */
export function createPublicSupabaseClient() {
  const { url, publishableKey } = getPublicSupabaseConfig();

  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

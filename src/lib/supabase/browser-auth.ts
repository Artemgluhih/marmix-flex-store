"use client";

import { createBrowserClient } from "@supabase/ssr";

/** User cookie session under RLS; never use the public guest or Secret client here. */
export function createAdminBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key?.startsWith("sb_publishable_")) {
    throw new Error("Загрузка недоступна. Обновите страницу позже.");
  }
  return createBrowserClient(url, key);
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createAuthSupabaseClient } from "@/lib/supabase/auth";
import { hasActiveAdminMembership } from "@/lib/admin/membership";
import { LoginForm } from "./LoginForm";
import { adminReturnPath } from "./return-path";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Вход в управление — Marmix Flex",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const client = await createAuthSupabaseClient();
  let clearNonAdminSession = false;
  let activeAdmin = false;

  try {
    const { data } = await client.auth.getUser();
    if (data.user) {
      activeAdmin = await hasActiveAdminMembership(client, data.user.id);
      clearNonAdminSession = !activeAdmin;
    }
  } catch {
    // A failed Auth read is unauthenticated, and cannot reveal private data.
  }

  if (activeAdmin) redirect(adminReturnPath(next));
  // Server Components cannot write cookies. The form clears non-admin sessions via a POST action.
  return <LoginForm returnPath={adminReturnPath(next)} clearNonAdminSession={clearNonAdminSession} />;
}

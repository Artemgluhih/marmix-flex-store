import type { ReactNode } from "react";
import type { Metadata } from "next";

import { requireAdmin } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Future workspace pages supply their own UI and recheck authorization before data reads. */
export default async function AdminWorkspaceLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return children;
}

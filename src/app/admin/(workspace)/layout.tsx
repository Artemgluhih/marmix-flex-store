import type { ReactNode } from "react";
import type { Metadata } from "next";

import { requireAdmin } from "@/lib/admin/require-admin";
import { AdminShell } from "./AdminShell";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** The server guard runs before the client shell or private page content renders. */
export default async function AdminWorkspaceLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}

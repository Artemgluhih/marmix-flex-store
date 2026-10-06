import type { Metadata } from "next";
import type { ReactNode } from "react";

// Covers login and all protected Admin routes independently of the deployment environment.
export const metadata: Metadata = {
  title: { default: "Управление — Marmix Flex", template: "%s" },
  description: "Закрытый раздел управления Marmix Flex.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}

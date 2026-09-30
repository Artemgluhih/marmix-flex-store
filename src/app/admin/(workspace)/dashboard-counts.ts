import "server-only";

import type { AdminContext } from "@/lib/admin/require-admin";

export type DashboardCounts = {
  newOrders: number;
  inProgressOrders: number;
  publishedProducts: number;
  hiddenProducts: number;
  archivedProducts: number;
};

/** Read only exact counts under the current administrator's JWT and T017 RLS. */
export async function getDashboardCounts(supabase: AdminContext["supabase"]): Promise<DashboardCounts> {
  const [newOrders, inProgressOrders, publishedProducts, hiddenProducts, archivedProducts] = await Promise.all([
    supabase.from("order_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("order_requests").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
    supabase.from("products").select("id", { count: "exact", head: true })
      .eq("catalog_kind", "REAL").eq("is_published", true).is("archived_at", null),
    supabase.from("products").select("id", { count: "exact", head: true })
      .eq("catalog_kind", "REAL").eq("is_published", false).is("archived_at", null),
    supabase.from("products").select("id", { count: "exact", head: true })
      .eq("catalog_kind", "REAL").not("archived_at", "is", null),
  ]);

  const results = [newOrders, inProgressOrders, publishedProducts, hiddenProducts, archivedProducts];
  if (results.some(({ error, count }) => error || typeof count !== "number")) {
    // Fail closed; neither a permission failure nor a transport error is a real zero.
    throw new Error("Не удалось загрузить показатели панели управления.");
  }

  return {
    newOrders: newOrders.count!,
    inProgressOrders: inProgressOrders.count!,
    publishedProducts: publishedProducts.count!,
    hiddenProducts: hiddenProducts.count!,
    archivedProducts: archivedProducts.count!,
  };
}

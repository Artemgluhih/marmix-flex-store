import "server-only";
import type { AdminContext } from "@/lib/admin/require-admin";
export type ProductOrderItem = { id: string; name: string; sku: string; sort_order: number };
/** Complete global active REAL list. Never reorder a filtered page or a truncated result. */
export async function readProductOrder(supabase: AdminContext["supabase"]): Promise<ProductOrderItem[]> {
  const rows: ProductOrderItem[] = [];
  const batch = 500;
  for (let offset = 0; offset < 10000; offset += batch) {
    const { data, error } = await supabase.from("products").select("id,name,sku,sort_order")
      .eq("catalog_kind", "REAL").is("archived_at", null)
      .order("sort_order", { ascending: true }).order("id", { ascending: true }).range(offset, offset + batch - 1);
    if (error || !data) throw new Error("Не удалось загрузить полный порядок товаров.");
    rows.push(...data);
    if (data.length < batch) return rows;
  }
  throw new Error("Полный список слишком велик для этого режима. Порядок не изменён.");
}

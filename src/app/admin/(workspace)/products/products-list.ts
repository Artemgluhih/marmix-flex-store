import "server-only";

import type { AdminContext } from "@/lib/admin/require-admin";

export type ProductListRow = {
  id: string;
  sku: string;
  name: string;
  price_minor: number | null;
  price_unit: string | null;
  is_published: boolean;
  archived_at: string | null;
  categories: { name: string } | null;
};

/** A single RLS-scoped read, including the category label through the FK. */
export async function getRealProducts(supabase: AdminContext["supabase"]): Promise<ProductListRow[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id,sku,name,price_minor,price_unit,is_published,archived_at,categories!inner(name)")
    .eq("catalog_kind", "REAL")
    .order("sort_order", { ascending: true })
    .order("sku", { ascending: true });

  if (error || !data) {
    throw new Error("Не удалось загрузить список товаров.");
  }
  // The untyped Supabase client models embedded relations as arrays; the FK is
  // many-to-one, so normalize the response to one category label per product.
  return data.map((product) => ({
    ...product,
    categories: Array.isArray(product.categories) ? product.categories[0] ?? null : product.categories,
  }));
}

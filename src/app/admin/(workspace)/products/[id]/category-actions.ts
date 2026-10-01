"use server";

import { revalidatePath } from "next/cache";
import { requireAdminMutation } from "@/lib/admin/require-admin";
import { validProductId } from "./edit-validation";

export type MembershipState = { selectedIds: string[]; error: string; saved: boolean };

export async function saveProductCategories(productId: string, _previous: MembershipState, form: FormData): Promise<MembershipState> {
  const { supabase } = await requireAdminMutation();
  const raw = form.getAll("category_ids");
  const selectedIds = raw.filter((item): item is string => typeof item === "string");
  const fail = (error: string): MembershipState => ({ selectedIds, error, saved: false });
  if (!validProductId(productId)) return fail("Товар не найден.");
  if (raw.length > 100 || raw.some((item) => typeof item !== "string")) return fail("Слишком много категорий.");
  const uniqueIds = [...new Set(selectedIds)];
  if (uniqueIds.some((id) => !validProductId(id))) return fail("Выберите существующие категории.");

  const [product, categories] = await Promise.all([
    supabase.from("products").select("id,catalog_kind").eq("id", productId).maybeSingle(),
    supabase.from("categories").select("id").in("id", uniqueIds.length ? uniqueIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);
  if (product.error || !product.data || (product.data.catalog_kind !== "REAL" &&
      !(process.env.VERCEL_ENV === "preview" && product.data.catalog_kind === "TEST_ONLY"))) return fail("Товар не найден.");
  if (categories.error || categories.data?.length !== uniqueIds.length) return fail("Выберите существующие категории.");

  const { error } = await supabase.rpc("set_product_categories", {
    p_product_id: productId, p_category_ids: uniqueIds,
  });
  if (error) return fail("Не удалось сохранить категории. Обновите страницу и повторите попытку.");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/categories");
  return { selectedIds: uniqueIds, error: "", saved: true };
}

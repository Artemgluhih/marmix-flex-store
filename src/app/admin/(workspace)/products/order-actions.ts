"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdminMutation } from "@/lib/admin/require-admin";
import { readProductOrder } from "./order-read";
import { productOrderVersion, validProductOrder } from "./order-model";

export async function saveProductOrder(ids: string[], expectedVersion: string): Promise<{ ok: boolean; message: string }> {
  const { supabase } = await requireAdminMutation();
  const fail = (message: string) => ({ ok: false, message });
  const read = () => readProductOrder(supabase);
  let current;
  try { current = { data: await read() }; } catch { return fail("Не удалось проверить полный список товаров. Обновите страницу."); }
  if (!current.data) return fail("Не удалось проверить порядок. Обновите страницу и повторите попытку.");
  if (!validProductOrder(ids, current.data)) return fail("Список товаров изменился. Обновите страницу.");
  if (typeof expectedVersion !== "string" || productOrderVersion(current.data) !== expectedVersion) {
    return fail("Порядок уже изменён в другой сессии. Обновите страницу.");
  }
  const invalidate = () => {
    updateTag("catalog:facets");
    updateTag("catalog:list");
    revalidatePath("/admin/products");
    revalidatePath("/admin/products/[id]", "page");
    revalidatePath("/");
    revalidatePath("/catalog");
  };
  // Existing RLS UPDATE boundary only. No upsert/INSERT, no commercial or publication fields.
  // Separate row updates cannot promise transaction atomicity; any partial failure is explicit.
  let changed = false;
  try {
    for (const [index, id] of ids.entries()) {
      const row = current.data.find((item) => item.id === id)!;
      if (row.sort_order === index) continue;
      const result = await supabase.from("products").update({ sort_order: index })
        .eq("id", id).eq("catalog_kind", "REAL").is("archived_at", null).eq("sort_order", row.sort_order).select("id").maybeSingle();
      if (result.error || !result.data) {
        invalidate();
        return fail(changed ? "Порядок сохранён не полностью. Список обновлён; проверьте его и повторите сохранение."
          : "Не удалось сохранить порядок. Список обновлён; повторите попытку.");
      }
      changed = true;
    }
    const verified = { data: await read() };
    invalidate();
    if (!verified.data || verified.data.length !== ids.length
      || verified.data.some((row, index) => row.id !== ids[index] || row.sort_order !== index)) {
      return fail("Не удалось подтвердить сохранение всего порядка. Список обновлён; проверьте его.");
    }
    return { ok: true, message: "Порядок сохранён." };
  } catch {
    invalidate();
    return fail("Не удалось подтвердить сохранение. Список обновлён; проверьте порядок и повторите попытку.");
  }
}

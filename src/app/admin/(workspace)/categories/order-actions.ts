"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdminMutation } from "@/lib/admin/require-admin";
import { categoryOrderVersion, validCategoryOrder } from "./order-model";

export async function saveCategoryOrder(ids: string[], expectedVersion: string): Promise<{ ok: boolean; message: string }> {
  const { supabase } = await requireAdminMutation();
  const fail = (message: string) => ({ ok: false, message });
  const read = () => supabase.from("categories").select("id,sort_order")
    .order("sort_order", { ascending: true }).order("id", { ascending: true });
  const current = await read();
  if (current.error || !current.data) return fail("Не удалось проверить порядок. Обновите страницу и повторите попытку.");
  if (!validCategoryOrder(ids, current.data)) return fail("Список категорий изменился. Обновите страницу.");
  if (typeof expectedVersion !== "string" || categoryOrderVersion(current.data) !== expectedVersion) {
    return fail("Порядок уже изменён в другой сессии. Обновите страницу.");
  }
  const invalidate = () => {
    updateTag("catalog:facets");
    updateTag("catalog:list");
    revalidatePath("/admin/categories");
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
      const result = await supabase.from("categories").update({ sort_order: index })
        .eq("id", id).eq("sort_order", row.sort_order).select("id").maybeSingle();
      if (result.error || !result.data) {
        invalidate();
        return fail(changed ? "Порядок сохранён не полностью. Список обновлён; проверьте его и повторите сохранение."
          : "Не удалось сохранить порядок. Список обновлён; повторите попытку.");
      }
      changed = true;
    }
    const verified = await read();
    invalidate();
    if (verified.error || !verified.data || verified.data.length !== ids.length
      || verified.data.some((row, index) => row.id !== ids[index] || row.sort_order !== index)) {
      return fail("Не удалось подтвердить сохранение всего порядка. Список обновлён; проверьте его.");
    }
    return { ok: true, message: "Порядок сохранён." };
  } catch {
    invalidate();
    return fail("Не удалось подтвердить сохранение. Список обновлён; проверьте порядок и повторите попытку.");
  }
}

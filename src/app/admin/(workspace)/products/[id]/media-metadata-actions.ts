"use server";

import { revalidatePath } from "next/cache";
import { requireAdminMutation } from "@/lib/admin/require-admin";
import { validProductId } from "./edit-validation";
import { validateMediaEdits, type MediaEdit } from "./media-metadata-validation";

export type SaveMediaResult = { ok: true } | { ok: false; error: string };

export async function saveMediaMetadata(
  productId: string, items: MediaEdit[], primaryId: string | null,
): Promise<SaveMediaResult> {
  const { supabase } = await requireAdminMutation();
  if (!validProductId(productId) || !Array.isArray(items) || !items.length) {
    return { ok: false, error: "Список изображений недействителен. Обновите страницу." };
  }
  const normalized = validateMediaEdits(items, primaryId);
  if (!normalized) {
    return { ok: false, error: "Проверьте изображения: alt — простой текст до 250 символов, роль — из списка." };
  }
  const result = await supabase.rpc("save_product_media", {
    p_product_id: productId, p_items: normalized, p_primary_id: primaryId,
  });
  if (result.error) {
    return { ok: false, error: "Не удалось сохранить изображения. Обновите страницу и повторите попытку." };
  }
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true };
}

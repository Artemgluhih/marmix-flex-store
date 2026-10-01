"use server";

import { revalidatePath } from "next/cache";
import { requireAdminMutation } from "@/lib/admin/require-admin";
import { validProductId } from "./edit-validation";
import { MEDIA_BUCKET, validMediaPath } from "./media-validation";

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FAILURE = "Не удалось удалить изображение. Попробуйте ещё раз.";
const PARTIAL = "Изображение удалено из товара, но файл не удалось удалить из хранилища. Повторите очистку.";

type Removal = { kind: "removed" } | { kind: "orphan"; path: string; error: string } |
  { kind: "denied"; error: string };
type Orphans = { ok: true; paths: string[] } | { ok: false; error: string };

async function missingAfterRemove(
  supabase: Awaited<ReturnType<typeof requireAdminMutation>>["supabase"], path: string,
) {
  const check = await supabase.storage.from(MEDIA_BUCKET).info(path);
  return Boolean(check.error && check.error.statusCode === "404");
}

async function productExists(supabase: Awaited<ReturnType<typeof requireAdminMutation>>["supabase"], productId: string) {
  const result = await supabase.from("products").select("id,is_published").eq("id", productId).maybeSingle();
  return !result.error ? result.data : null;
}

export async function removeProductImage(productId: string, imageId: string): Promise<Removal> {
  const { supabase } = await requireAdminMutation();
  if (!validProductId(productId) || !ID.test(imageId)) return { kind: "denied", error: FAILURE };
  const product = await productExists(supabase, productId);
  const image = await supabase.from("product_images")
    .select("id,product_id,storage_path,is_primary").eq("id", imageId).maybeSingle();
  if (!product || image.error || !image.data || image.data.product_id !== productId ||
      !validMediaPath(productId, image.data.storage_path)) {
    return { kind: "denied", error: FAILURE };
  }
  if (product.is_published && image.data.is_primary) {
    return { kind: "denied", error: "Нельзя удалить главное изображение опубликованного товара. Сначала назначьте другое изображение главным или снимите товар с публикации." };
  }

  // The DB trigger repeats the published-primary check inside the DELETE
  // transaction, including direct PostgREST requests and concurrent publishes.
  const detached = await supabase.from("product_images").delete()
    .eq("id", imageId).eq("product_id", productId).select("id");
  if (detached.error || detached.data?.length !== 1) return { kind: "denied", error: FAILURE };
  revalidatePath(`/admin/products/${productId}`);

  try {
    await supabase.storage.from(MEDIA_BUCKET).remove([image.data.storage_path]);
    if (!(await missingAfterRemove(supabase, image.data.storage_path))) {
      return { kind: "orphan", path: image.data.storage_path, error: PARTIAL };
    }
  } catch {
    try {
      if (!(await missingAfterRemove(supabase, image.data.storage_path))) {
        return { kind: "orphan", path: image.data.storage_path, error: PARTIAL };
      }
    } catch { return { kind: "orphan", path: image.data.storage_path, error: PARTIAL }; }
  }
  return { kind: "removed" };
}

export async function findOrphanImages(productId: string): Promise<Orphans> {
  const { supabase } = await requireAdminMutation();
  if (!validProductId(productId) || !(await productExists(supabase, productId))) {
    return { ok: false, error: "Товар не найден." };
  }
  const linked = await supabase.from("product_images").select("storage_path").eq("product_id", productId);
  if (linked.error || !linked.data) return { ok: false, error: "Не удалось проверить изображения товара." };
  const linkedPaths = new Set(linked.data.map(({ storage_path }) => storage_path));
  const prefix = `products/${productId}/`;
  const paths: string[] = [];
  // Bounded, exact product folder only. Large folders fail closed rather than
  // yielding an incomplete candidate set. Folder placeholders are ignored.
  for (let offset = 0; offset < 1000; offset += 100) {
    const result = await supabase.storage.from(MEDIA_BUCKET).list(prefix, {
      limit: 100, offset, sortBy: { column: "name", order: "asc" },
    });
    if (result.error || !result.data) return { ok: false, error: "Не удалось проверить файлы товара." };
    for (const item of result.data) {
      const path = prefix + item.name;
      if (item.id && validMediaPath(productId, path) && !linkedPaths.has(path)) paths.push(path);
    }
    if (result.data.length < 100) return { ok: true, paths };
  }
  return { ok: false, error: "Слишком много файлов для безопасной проверки. Обратитесь к администратору." };
}

export async function retryOrphanCleanup(productId: string, path: string): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await requireAdminMutation();
  if (!validProductId(productId) || typeof path !== "string" || !validMediaPath(productId, path) ||
      !(await productExists(supabase, productId))) return { ok: false, error: "Файл не найден." };
  // Check all image rows (storage_path is globally unique), not just this product.
  const linked = await supabase.from("product_images").select("id").eq("storage_path", path).maybeSingle();
  if (linked.error || linked.data) return { ok: false, error: "Файл связан с товаром и не может быть очищен." };
  const object = await supabase.storage.from(MEDIA_BUCKET).info(path);
  if (object.error?.statusCode === "404") return { ok: true };
  if (object.error || !object.data) return { ok: false, error: "Состояние файла не удалось проверить." };
  await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  if (!(await missingAfterRemove(supabase, path))) {
    return { ok: false, error: "Файл не удалось удалить из хранилища. Повторите попытку." };
  }
  return { ok: true };
}

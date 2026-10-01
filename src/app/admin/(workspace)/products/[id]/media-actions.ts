"use server";

import { revalidatePath } from "next/cache";
import { requireAdminMutation } from "@/lib/admin/require-admin";
import { MEDIA_BUCKET, MAX_IMAGE_BYTES, validImageDimensions, validMediaPath } from "./media-validation";
import { validProductId } from "./edit-validation";

export type LinkMediaResult = { ok: true; id: string } | { ok: false; error: string };

export async function linkUploadedImage(productId: string, path: string, width: number, height: number): Promise<LinkMediaResult> {
  const { supabase } = await requireAdminMutation();
  const failure = (error: string): LinkMediaResult => ({ ok: false, error });
  if (!validProductId(productId) || !validMediaPath(productId, path) || !validImageDimensions(width, height)) {
    return failure("Некорректные данные изображения.");
  }

  const productResult = await supabase.from("products").select("id,catalog_kind").eq("id", productId).maybeSingle();
  if (productResult.error || !productResult.data ||
      (productResult.data.catalog_kind !== "REAL" && !(process.env.VERCEL_ENV === "preview" && productResult.data.catalog_kind === "TEST_ONLY"))) {
    return failure("Товар не найден.");
  }

  // An authenticated, active-admin Storage SELECT checks the exact uploaded object.
  // Do not accept an arbitrary URL or an object from another bucket/product folder.
  const object = await supabase.storage.from(MEDIA_BUCKET).info(path);
  const extension = path.split(".").at(-1)?.toLowerCase();
  const mimeExtensions: Record<string, string[]> = {
    "image/jpeg": ["jpg", "jpeg"], "image/png": ["png"], "image/webp": ["webp"], "image/avif": ["avif"],
  };
  if (object.error || !object.data || object.data.bucketId !== MEDIA_BUCKET ||
      !mimeExtensions[object.data.contentType ?? ""]?.includes(extension ?? "") ||
      !object.data.size || object.data.size > MAX_IMAGE_BYTES) {
    return failure("Загруженное изображение не найдено или его формат недопустим.");
  }

  const latest = await supabase.from("product_images").select("sort_order")
    .eq("product_id", productId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  if (latest.error || (latest.data && latest.data.sort_order >= 2147483647)) {
    return failure("Не удалось определить порядок изображения.");
  }
  const insert = await supabase.from("product_images").insert({
    product_id: productId, storage_path: path, width, height,
    role: null, alt: null, sort_order: (latest.data?.sort_order ?? -1) + 1,
  }).select("id").single();
  if (insert.error || !insert.data) return failure("Не удалось привязать изображение к товару.");

  revalidatePath(`/admin/products/${productId}`);
  return { ok: true, id: insert.data.id };
}

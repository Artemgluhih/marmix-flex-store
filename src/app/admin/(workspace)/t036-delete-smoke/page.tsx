import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin, requireAdminMutation } from "@/lib/admin/require-admin";
import { MEDIA_BUCKET, mediaPathFor } from "../products/[id]/media-validation";

// Temporary Preview-only owner verification fixture. Remove this route after cleanup.
const PRODUCT_ID = "d8d2f0b5-4453-4862-8c59-0f9471c337ae";
const SKU_PREFIX = "TEST_ONLY-T036-BROWSER-";
const EDITOR = `/admin/products/${PRODUCT_ID}`;
const PIXELS = [
  ["a-primary", "iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAAH0lEQVR4nGPY0OlAFcQwatCoQaMGjRo0atCoQQNvEABIAFBuzK4LHwAAAABJRU5ErkJggg=="],
  ["b-delete", "iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAAH0lEQVR4nGPwi82nCmIYNWjUoFGDRg0aNWjUoIE3CABpzXqfo3IIWQAAAABJRU5ErkJggg=="],
  ["t036-failure-c", "iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAAH0lEQVR4nGMoDk6lCmIYNWjUoFGDRg0aNWjUoIE3CAC+OqDfpQ9THAAAAABJRU5ErkJggg=="],
] as const;

async function prepareTechnicalImages() {
  "use server";
  const { supabase } = await requireAdminMutation();
  if (process.env.VERCEL_ENV !== "preview") redirect("/admin");
  const product = await supabase.from("products").select("id,sku,catalog_kind,is_published")
    .eq("id", PRODUCT_ID).maybeSingle();
  if (product.error || product.data?.catalog_kind !== "TEST_ONLY" ||
      !product.data.sku.startsWith(SKU_PREFIX) || product.data.is_published) redirect("/admin");
  const existing = await supabase.from("product_images").select("id").eq("product_id", PRODUCT_ID).limit(1);
  if (existing.error) redirect("/admin/t036-delete-smoke?error=1");
  if (existing.data?.length) redirect(EDITOR);

  const uploadedPaths: string[] = [];
  const insertedIds: string[] = [];
  let failed = false;
  for (const [index, [label, base64]] of PIXELS.entries()) {
    // Fixture UUID makes these keys unique without an extra manifest or database state.
    const path = mediaPathFor(PRODUCT_ID, `${label}-${PRODUCT_ID.replaceAll("-", "")}`, "png");
    const uploaded = await supabase.storage.from(MEDIA_BUCKET).upload(path, Buffer.from(base64, "base64"), {
      contentType: "image/png", upsert: false,
    });
    if (uploaded.error) { failed = true; break; }
    uploadedPaths.push(path);
    const linked = await supabase.from("product_images").insert({
      product_id: PRODUCT_ID, storage_path: path, width: 24, height: 24,
      role: null, alt: null, sort_order: index, is_primary: index === 0,
    }).select("id").single();
    if (linked.error || !linked.data) { failed = true; break; }
    insertedIds.push(linked.data.id);
  }
  if (failed) {
    if (insertedIds.length) await supabase.from("product_images").delete().in("id", insertedIds).eq("product_id", PRODUCT_ID);
    if (uploadedPaths.length) await supabase.storage.from(MEDIA_BUCKET).remove(uploadedPaths);
    redirect("/admin/t036-delete-smoke?error=1");
  }
  redirect(EDITOR);
}

export default async function T036DeleteSmoke({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { supabase } = await requireAdmin("/admin/t036-delete-smoke");
  if (process.env.VERCEL_ENV !== "preview") redirect("/admin");
  const [product, images] = await Promise.all([
    supabase.from("products").select("sku,catalog_kind").eq("id", PRODUCT_ID).maybeSingle(),
    supabase.from("product_images").select("id").eq("product_id", PRODUCT_ID).limit(1),
  ]);
  if (product.error || product.data?.catalog_kind !== "TEST_ONLY" ||
      !product.data.sku.startsWith(SKU_PREFIX) || images.error) redirect("/admin");
  const { error } = await searchParams;
  return <main style={{ maxWidth: 680, padding: "2rem", margin: "0 auto" }}>
    <h1>T036 — TEST_ONLY проверка удаления</h1>
    <p>Временный товар в Supabase Preview. Три технических изображения: A — главное, B — обычное удаление, C — контролируемый отказ Storage. Реальные товары и медиа не используются.</p>
    {error && <p role="alert">Подготовка не завершилась. Не продолжайте проверку и сообщите о сбое для технической очистки.</p>}
    {images.data?.length ? <Link href={EDITOR}>Открыть Product Editor</Link> :
      <form action={prepareTechnicalImages}><button type="submit">Подготовить изображения A, B, C</button></form>}
  </main>;
}

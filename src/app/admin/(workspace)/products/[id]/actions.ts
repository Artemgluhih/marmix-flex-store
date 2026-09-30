"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminMutation } from "@/lib/admin/require-admin";
import { readEditValues, validateEditValues, validProductId, type EditErrors, type EditValues } from "./edit-validation";

export type EditState = { values: EditValues; errors: EditErrors };

export async function saveProductProperties(productId: string, _previous: EditState, form: FormData): Promise<EditState> {
  const { supabase } = await requireAdminMutation();
  const values = readEditValues(form);
  const fail = (errors: EditErrors): EditState => ({ values, errors });
  if (!validProductId(productId)) return fail({ form: "Товар не найден." });

  const existing = await supabase.from("products")
    .select("id,catalog_kind,price_unit,sale_unit")
    .eq("id", productId).maybeSingle();
  if (existing.error) return fail({ form: "Не удалось загрузить товар. Повторите попытку." });
  const product = existing.data;
  if (!product || (product.catalog_kind !== "REAL" && !(process.env.VERCEL_ENV === "preview" && product.catalog_kind === "TEST_ONLY"))) {
    return fail({ form: "Товар не найден." });
  }

  const validated = validateEditValues(values, product);
  if (!validated.input) return fail(validated.errors);
  // Explicit T029 allowlist. Submitted id, SKU, slug, price and state fields are ignored.
  const { description, width_mm, height_mm, thickness_mm, area_per_sale_unit_m2, specifications, seo_title, seo_description } = validated.input;
  const saved = await supabase.from("products").update({
    description, width_mm, height_mm, thickness_mm, area_per_sale_unit_m2,
    specifications, seo_title, seo_description,
  }).eq("id", productId).eq("catalog_kind", product.catalog_kind).select("id").maybeSingle();
  if (saved.error || !saved.data) return fail({ form: "Не удалось сохранить изменения. Повторите попытку." });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  redirect(`/admin/products/${productId}?saved=1`);
}

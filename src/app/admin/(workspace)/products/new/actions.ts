"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminMutation } from "@/lib/admin/require-admin";
import {
  uniqueProductError, validateProductValues, valuesFromForm,
  type ProductErrors, type ProductValues,
} from "./product-validation";

export type CreateProductState = { values: ProductValues; selectedIds: string[]; errors: ProductErrors };

export async function createProductAction(_previous: CreateProductState, formData: FormData): Promise<CreateProductState> {
  // A workspace layout, form control and browser Origin are never authorization.
  const { supabase } = await requireAdminMutation();
  const values = valuesFromForm(formData);
  const rawCategoryIds = formData.getAll("category_ids");
  const selectedIds = rawCategoryIds.filter((item): item is string => typeof item === "string");
  const fail = (errors: ProductErrors): CreateProductState => ({ values, selectedIds, errors });
  if (rawCategoryIds.length > 100 || selectedIds.length !== rawCategoryIds.length) return fail({ category_ids: "Слишком много категорий." });

  const categories = await supabase.from("categories").select("id");
  if (categories.error || !categories.data) return fail({ form: "Не удалось проверить категории. Повторите попытку." });
  const validated = validateProductValues(values, categories.data.map(({ id }) => id), selectedIds);
  if (!validated.input) return fail(validated.errors);

  const { input } = validated;
  const [existingSku, existingSlug] = await Promise.all([
    supabase.from("products").select("id").eq("sku", input.sku).limit(1),
    supabase.from("products").select("id").eq("slug", input.slug).limit(1),
  ]);
  if (existingSku.error || existingSlug.error) return fail({ form: "Не удалось проверить уникальность товара. Повторите попытку." });
  if (existingSku.data?.length || existingSlug.data?.length) return fail({
    ...(existingSku.data?.length ? { sku: "Такой SKU уже существует." } : {}),
    ...(existingSlug.data?.length ? { slug: "Такой адрес уже существует." } : {}),
  });

  // Invoker RPC keeps the product INSERT and membership delta in one DB transaction.
  const { error } = await supabase.rpc("create_product_with_categories", {
    p_name: input.name, p_sku: input.sku, p_slug: input.slug, p_series: input.series,
    p_price_minor: input.price_minor, p_price_unit: input.price_unit, p_sale_unit: input.sale_unit,
    p_min_quantity: input.min_quantity, p_quantity_step: input.quantity_step, p_category_ids: input.category_ids,
  });
  if (error) {
    // The database UNIQUE keys decide races after the optimistic duplicate check.
    const duplicate = uniqueProductError(error.code, error.message);
    if (duplicate) return fail(duplicate);
    if (error.code === "22023" || error.code === "23503") return fail({ category_ids: "Категория больше не доступна. Выберите её снова." });
    return fail({ form: "Не удалось сохранить черновик. Проверьте данные и попробуйте снова." });
  }

  revalidatePath("/admin/products");
  redirect("/admin/products?sort=newest");
}

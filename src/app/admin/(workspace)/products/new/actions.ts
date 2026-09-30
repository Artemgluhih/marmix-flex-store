"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminMutation } from "@/lib/admin/require-admin";
import {
  uniqueProductError, validateProductValues, valuesFromForm,
  type ProductErrors, type ProductValues,
} from "./product-validation";

export type CreateProductState = { values: ProductValues; errors: ProductErrors };

export async function createProductAction(_previous: CreateProductState, formData: FormData): Promise<CreateProductState> {
  // A workspace layout, form control and browser Origin are never authorization.
  const { supabase } = await requireAdminMutation();
  const values = valuesFromForm(formData);
  const fail = (errors: ProductErrors): CreateProductState => ({ values, errors });

  const categories = await supabase.from("categories").select("id");
  if (categories.error || !categories.data) return fail({ form: "Не удалось проверить категории. Повторите попытку." });
  const validated = validateProductValues(values, categories.data.map(({ id }) => id));
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

  const { error } = await supabase.from("products").insert({
    ...input,
    catalog_kind: "REAL",
    is_published: false,
    archived_at: null,
  });
  if (error) {
    // The database UNIQUE keys decide races after the optimistic duplicate check.
    const duplicate = uniqueProductError(error.code, error.message);
    if (duplicate) return fail(duplicate);
    if (error.code === "23503") return fail({ category_id: "Категория больше не доступна. Выберите её снова." });
    return fail({ form: "Не удалось сохранить черновик. Проверьте данные и попробуйте снова." });
  }

  revalidatePath("/admin/products");
  redirect("/admin/products?sort=newest");
}

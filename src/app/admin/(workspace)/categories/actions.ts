"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminMutation } from "@/lib/admin/require-admin";
import { categoryValuesFromForm, validateCategory, validCategoryId, type CategoryErrors, type CategoryValues } from "./category-validation";

export type CategoryState = { values: CategoryValues; errors: CategoryErrors };

export async function saveCategory(categoryId: string | null, _previous: CategoryState, form: FormData): Promise<CategoryState> {
  const { supabase } = await requireAdminMutation();
  const values = categoryValuesFromForm(form);
  const fail = (errors: CategoryErrors): CategoryState => ({ values, errors });
  const mode = categoryId === null ? "create" : "edit";
  if (categoryId !== null && !validCategoryId(categoryId)) return fail({ form: "Категория не найдена." });
  // Publication is controlled only by the separate, confirmed T032 actions.
  const current = categoryId === null ? null : await supabase.from("categories")
    .select("id,slug,is_published").eq("id", categoryId).maybeSingle();
  if (current && (current.error || !current.data)) return fail({ form: "Категория не найдена. Обновите страницу." });
  const checked = validateCategory({ ...values, status: current?.data?.is_published ? "published" : "draft" }, mode);
  if (!checked.input) return fail(checked.errors);
  const input = checked.input;

  if (categoryId === null) {
    // Only schema fields in this literal object; new rows always start unpublished.
    const created = await supabase.from("categories").insert({
      name: input.name, slug: input.slug, description: input.description, sort_order: input.sort_order,
      seo_title: input.seo_title, seo_description: input.seo_description, is_published: false,
    }).select("id").maybeSingle();
    if (created.error) return fail(created.error.code === "23505" ? { slug: "Такой slug уже используется." } : { form: "Не удалось сохранить категорию. Повторите попытку." });
    if (!created.data) return fail({ form: "Не удалось сохранить категорию. Повторите попытку." });
    revalidatePath("/admin/categories");
    revalidatePath("/admin/products/new");
    redirect(`/admin/categories?edit=${created.data.id}&saved=1`);
  }

  if (!current?.data) return fail({ form: "Категория не найдена. Обновите страницу." });
  if (current.data.is_published && input.slug !== current.data.slug) return fail({ slug: "Адрес опубликованной категории нельзя изменить без перенаправления." });

  const updated = await supabase.from("categories").update({
    name: input.name, slug: input.slug, description: input.description, sort_order: input.sort_order,
    seo_title: input.seo_title, seo_description: input.seo_description,
  }).eq("id", categoryId).eq("is_published", current.data.is_published).eq("slug", current.data.slug)
    .select("id").maybeSingle();
  if (updated.error) return fail(updated.error.code === "23505" ? { slug: "Такой slug уже используется." } : { form: "Не удалось сохранить категорию. Повторите попытку." });
  if (!updated.data) return fail({ form: "Категория изменилась. Обновите страницу и повторите действие." });
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products/new");
  revalidatePath("/admin/products");
  redirect(`/admin/categories?edit=${categoryId}&saved=1`);
}

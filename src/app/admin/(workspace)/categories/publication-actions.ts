"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminMutation } from "@/lib/admin/require-admin";
import { validCategoryId } from "./category-validation";

async function transitionCategoryPublication(categoryId: string, publish: boolean): Promise<void> {
  const { supabase } = await requireAdminMutation();
  if (!validCategoryId(categoryId)) redirect("/admin/categories");

  // The only write is this category flag; never update child products.
  const { data, error } = await supabase.from("categories")
    .update({ is_published: publish })
    .eq("id", categoryId)
    .eq("is_published", !publish)
    .select("id")
    .maybeSingle();
  if (error) throw new Error("Не удалось изменить публикацию категории. Повторите попытку.");
  if (!data) redirect(`/admin/categories?edit=${categoryId}&notice=stale`);

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/admin");
  redirect(`/admin/categories?edit=${categoryId}&saved=1`);
}

export async function publishCategory(categoryId: string): Promise<void> {
  await transitionCategoryPublication(categoryId, true);
}

export async function unpublishCategory(categoryId: string): Promise<void> {
  await transitionCategoryPublication(categoryId, false);
}

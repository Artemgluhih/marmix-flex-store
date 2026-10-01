"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminMutation } from "@/lib/admin/require-admin";
import { validCategoryId } from "./category-validation";

export async function deleteCategory(categoryId: string): Promise<void> {
  const { supabase } = await requireAdminMutation();
  if (!validCategoryId(categoryId)) redirect("/admin/categories?notice=stale");
  // Published category URLs must first be explicitly withdrawn. Only the
  // category row and its membership links are deleted by the FK cascade.
  const deleted = await supabase.from("categories").delete()
    .eq("id", categoryId).eq("is_published", false).select("id").maybeSingle();
  if (deleted.error) throw new Error("Не удалось удалить категорию. Повторите попытку.");
  if (!deleted.data) redirect(`/admin/categories?edit=${categoryId}&notice=stale`);
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
  redirect("/admin/categories?deleted=1");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminMutation } from "@/lib/admin/require-admin";
import { validProductId } from "./edit-validation";
import { transitionPatch, transitions, validateAssortment, type Transition, type AssortmentErrors } from "./assortment-validation";

export type AssortmentState = { errors: AssortmentErrors; values: { availability: string; featured: boolean; sortOrder: string } };
export type TransitionState = { error?: string };

function editable(kind: string) { return kind === "REAL" || (process.env.VERCEL_ENV === "preview" && kind === "TEST_ONLY"); }
function refresh(productId: string) {
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin");
}

export async function saveAssortment(productId: string, previous: AssortmentState, form: FormData): Promise<AssortmentState> {
  const { supabase } = await requireAdminMutation();
  const validated = validateAssortment(form);
  const fail = (message: string): AssortmentState => ({ errors: { form: message }, values: validated.values });
  if (!validProductId(productId)) return fail("Товар не найден.");
  if (!validated.input) return { errors: validated.errors, values: validated.values };
  const found = await supabase.from("products").select("catalog_kind").eq("id", productId).maybeSingle();
  if (found.error || !found.data || !editable(found.data.catalog_kind)) return fail("Товар не найден.");
  // Only these three fields are accepted; unknown FormData keys are ignored.
  const saved = await supabase.from("products").update(validated.input)
    .eq("id", productId).eq("catalog_kind", found.data.catalog_kind).select("id").maybeSingle();
  if (saved.error || !saved.data) return fail("Не удалось сохранить параметры. Повторите попытку.");
  refresh(productId);
  redirect(`/admin/products/${productId}?state=assortment`);
}

export async function changePublication(productId: string, command: Transition, _previous: TransitionState): Promise<TransitionState> {
  void _previous;
  const { supabase } = await requireAdminMutation();
  if (!validProductId(productId) || !transitions.includes(command)) return { error: "Недопустимое действие." };
  const found = await supabase.from("products").select("catalog_kind,is_published,archived_at")
    .eq("id", productId).maybeSingle();
  if (found.error || !found.data || !editable(found.data.catalog_kind)) return { error: "Товар не найден." };
  const next = transitionPatch(command, found.data);
  if ("error" in next) return { error: next.error };
  if (command === "publish") {
    const [primary, incomplete] = await Promise.all([
      supabase.from("product_images").select("id", { count: "exact", head: true })
        .eq("product_id", productId).eq("is_primary", true),
      supabase.from("product_images").select("id", { count: "exact", head: true })
        .eq("product_id", productId).or("role.is.null,alt.is.null"),
    ]);
    if (primary.error || incomplete.error) return { error: "Не удалось проверить изображения товара. Повторите попытку." };
    if (primary.count !== 1) return { error: "Перед публикацией выберите главное изображение." };
    if (incomplete.count !== 0) return { error: "Перед публикацией заполните alt и роль для всех изображений." };
  }
  // Optimistic precondition makes a concurrent archive/restore fail closed.
  let query = supabase.from("products").update(next.patch)
    .eq("id", productId).eq("catalog_kind", found.data.catalog_kind)
    .eq("is_published", found.data.is_published);
  query = found.data.archived_at === null ? query.is("archived_at", null) : query.eq("archived_at", found.data.archived_at);
  const saved = await query.select("id").maybeSingle();
  if (saved.error || !saved.data) return { error: "Состояние товара изменилось. Обновите страницу и повторите действие." };
  refresh(productId);
  redirect(`/admin/products/${productId}?state=${command}`);
}

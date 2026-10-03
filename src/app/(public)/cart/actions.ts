"use server";

import { getCartProductsFreshByIds } from "@/lib/catalog/queries";

export async function refreshCartProducts(ids: unknown) {
  try {
    return await getCartProductsFreshByIds(ids);
  } catch {
    // Never serialize a Supabase/Postgres error, endpoint, or key to the browser.
    throw new Error("Не удалось проверить позиции. Повторите попытку.");
  }
}

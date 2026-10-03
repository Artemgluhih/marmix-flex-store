"use server";

import { lookupExistingOrder, resolveIdempotency } from "@/lib/orders/idempotency";
import { insertPreparedOrder } from "@/lib/orders/insert";
import { prepareOrder } from "@/lib/orders/prepare";
import type { ValidatedOrderRequest } from "@/lib/orders/validate-request";
import type { PublicProduct } from "@/lib/catalog/types";

type ReviewResult = { state: "created" | "replayed"; id: string } |
  { state: "race_pass"; id: string } |
  { state: "conflict" | "cart_changed" | "error" };

// Temporary technical fixture only. It is not a DB product or a public catalog SKU.
const product: PublicProduct = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", sku: "TEST_ONLY-T054",
  slug: "technical-order-review", name: "Технический образец", series: null,
  priceMinor: 200000, currency: "RUB", priceUnit: "м²", saleUnit: "sheet",
  minQuantity: 1, quantityStep: 1, areaPerSaleUnitM2: 4.0328,
  sourcePriceRange: null, availabilityStatus: "in_stock", isFeatured: false,
  sortOrder: 0, categories: [], primaryImage: null,
};

export async function submitTechnicalOrder(mode: "submit" | "retry" | "conflict" | "race" | "changed" | "error"):
  Promise<ReviewResult> {
  if (process.env.VERCEL_ENV !== "preview") return { state: "error" };
  if (!["submit", "retry", "conflict", "race", "changed", "error"].includes(mode)) return { state: "error" };
  if (mode === "error") return { state: "error" }; // no DB call, tests safe retry UI
  if (mode === "changed") return { state: "cart_changed" }; // no DB call, tests update path
  const quantity = mode === "conflict" ? 2 : 3;
  const request: ValidatedOrderRequest = {
    version: 1, idempotencyKey: mode === "race"
      ? "cccccccc-cccc-4ccc-8ccc-cccccccccccc"
      : "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    contact: { name: "Тестовый пользователь", phone: "+7 900 000-00-00",
      city: "", email: "", comment: "" },
    items: [{ productId: product.id, quantity, displayedPriceMinor: 200000,
      displayedPriceUnit: "м²", displayedSaleUnit: "sheet" }],
  };
  try {
    const existing = await lookupExistingOrder(request.idempotencyKey);
    const resolution = resolveIdempotency(request, existing);
    if (resolution.status === "same") return { state: "replayed", id: resolution.id };
    if (resolution.status === "conflict") return { state: "conflict" };
    const prepared = prepareOrder(request, [product], resolution.hash);
    if (!prepared.ok) return { state: "cart_changed" };
    if (mode === "race") {
      // Technical Preview only: two private INSERT attempts compete on the same fresh key.
      const [first, second] = await Promise.all([
        insertPreparedOrder(prepared.value), insertPreparedOrder(prepared.value),
      ]);
      if (first.status === "created" && second.status === "replayed" && first.id === second.id ||
          first.status === "replayed" && second.status === "created" && first.id === second.id)
        return { state: "race_pass", id: first.id };
      return { state: "error" };
    }
    const inserted = await insertPreparedOrder(prepared.value);
    if (inserted.status === "created" || inserted.status === "replayed") return { state: inserted.status, id: inserted.id };
    return { state: inserted.status === "conflict" ? "conflict" : "error" };
  } catch {
    return { state: "error" };
  }
}

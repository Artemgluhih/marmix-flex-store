"use server";

import { lookupExistingOrder, resolveIdempotency } from "@/lib/orders/idempotency";
import { insertPreparedOrder } from "@/lib/orders/insert";
import { prepareOrder } from "@/lib/orders/prepare";
import type { ValidatedOrderRequest } from "@/lib/orders/validate-request";
import type { PublicProduct } from "@/lib/catalog/types";
import { POST } from "@/app/api/order-requests/route";

type ReviewResult = { state: "created" | "replayed"; id: string } |
  { state: "race_pass"; id: string } |
  { state: "negative_pass" } |
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

export async function submitTechnicalOrder(mode: "submit" | "retry" | "conflict" | "race" | "negative" | "changed" | "error"):
  Promise<ReviewResult> {
  if (process.env.VERCEL_ENV !== "preview") return { state: "error" };
  if (!["submit", "retry", "conflict", "race", "negative", "changed", "error"].includes(mode)) return { state: "error" };
  if (mode === "error") return { state: "error" }; // no DB call, tests safe retry UI
  if (mode === "changed") return { state: "cart_changed" }; // no DB call, tests update path
  if (mode === "negative") return verifyNegativeApiCases();
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

async function verifyNegativeApiCases(): Promise<ReviewResult> {
  const hostname = process.env.VERCEL_URL;
  if (!hostname) return { state: "error" };
  const base = `https://${hostname}`;
  const azur = "658e4245-59b0-4d73-b0f1-722f932b006e";
  const requestBody = (suffix: string, productId = azur) => ({
    version: 1, idempotency_key: `dddddddd-dddd-4ddd-8ddd-00000000000${suffix}`,
    name: "Тестовый пользователь", phone: "+7 900 000-00-00",
    items: [{ product_id: productId, quantity: 1, price_minor: 200000,
      price_unit: "м²", sale_unit: "sheet" }],
  });
  const cases: { body: object; status: number; code: string; origin?: string }[] = [
    { body: requestBody("1"), status: 409, code: "CART_CHANGED" },
    { body: { ...requestBody("2"), items: [{ ...requestBody("2").items[0], price_minor: 210000 }] },
      status: 409, code: "CART_CHANGED" },
    { body: { ...requestBody("3"), items: [{ ...requestBody("3").items[0], price_unit: "лист" }] },
      status: 409, code: "CART_CHANGED" },
    { body: { ...requestBody("4"), items: [{ ...requestBody("4").items[0], quantity: 0 }] },
      status: 400, code: "INVALID_FIELDS" },
    { body: requestBody("5", "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"),
      status: 409, code: "CART_CHANGED" },
    { body: { ...requestBody("6"), unknown_field: "test" }, status: 400, code: "INVALID_FIELDS" },
    { body: requestBody("7"), status: 403, code: "FORBIDDEN_ORIGIN",
      origin: "https://example.test" },
  ];
  try {
    for (const item of cases) {
      const response = await POST(new Request(`${base}/api/order-requests`, {
        method: "POST", headers: { "Content-Type": "application/json",
          Origin: item.origin ?? base },
        body: JSON.stringify(item.body),
      }));
      const result = await response.json();
      if (response.status !== item.status || result.code !== item.code) return { state: "error" };
    }
    const existing = await lookupExistingOrder("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    if (!existing) return { state: "error" };
    const replayBody = {
      ...requestBody("8", product.id),
      idempotency_key: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      items: [{ ...requestBody("8", product.id).items[0], quantity: 3 }],
    };
    const callRoute = (body: object) => POST(new Request(`${base}/api/order-requests`, {
      method: "POST", headers: { "Content-Type": "application/json", Origin: base },
      body: JSON.stringify(body),
    }));
    const replay = await callRoute(replayBody);
    const replayResult = await replay.json();
    if (replay.status !== 200 || replayResult.request_id !== existing.id ||
        replayResult.submitted !== true || replayResult.replayed !== true)
      return { state: "error" };
    const conflict = await callRoute({ ...replayBody,
      items: [{ ...replayBody.items[0], quantity: 2 }] });
    if (conflict.status !== 409 || (await conflict.json()).code !== "IDEMPOTENCY_CONFLICT")
      return { state: "error" };
    return { state: "negative_pass" };
  } catch {
    return { state: "error" };
  }
}

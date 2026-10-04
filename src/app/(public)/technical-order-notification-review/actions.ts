"use server";

import { lookupExistingOrder, resolveIdempotency } from "@/lib/orders/idempotency";
import { insertPreparedOrder } from "@/lib/orders/insert";
import { prepareOrder } from "@/lib/orders/prepare";
import { missingPreviewNotificationEnvNames, notifyCreatedOrder } from "@/lib/orders/notifications";
import type { PublicProduct } from "@/lib/catalog/types";
import type { ValidatedOrderRequest } from "@/lib/orders/validate-request";

type ReviewResult = { state: "created"; id: string; totalMinor: number } |
  { state: "replayed"; id: string } |
  { state: "unavailable" };

// Render-only TEST_ONLY product. No products/media/categories DB row is created.
const product: PublicProduct = {
  id: "e46e8d7a-1468-4568-a25a-f842229c904e",
  sku: "TEST_ONLY-T054A", slug: "technical-order-notification-review",
  name: "Технический образец", series: null,
  priceMinor: 200000, currency: "RUB", priceUnit: "м²", saleUnit: "sheet",
  minQuantity: 1, quantityStep: 1, areaPerSaleUnitM2: 4.0328,
  sourcePriceRange: null, availabilityStatus: "in_stock", isFeatured: false,
  sortOrder: 0, categories: [], primaryImage: null,
};

const request: ValidatedOrderRequest = {
  version: 1,
  idempotencyKey: "ef8aca73-7848-43bf-b694-f76a16916ad1",
  contact: {
    name: "Тестовый пользователь", phone: "+7 900 000-00-00",
    city: "Тестовый город", email: "test@example.test", comment: "Тестовое уведомление",
  },
  items: [{
    productId: product.id, quantity: 3, displayedPriceMinor: 200000,
    displayedPriceUnit: "м²", displayedSaleUnit: "sheet",
  }],
};

export async function submitTechnicalTelegramReview(): Promise<ReviewResult> {
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.VERCEL_GIT_COMMIT_REF !== "t054a-preview-review" ||
      missingPreviewNotificationEnvNames().length) return { state: "unavailable" };
  try {
    const existing = await lookupExistingOrder(request.idempotencyKey);
    const resolution = resolveIdempotency(request, existing);
    if (resolution.status === "conflict") return { state: "unavailable" };
    if (resolution.status === "same") return { state: "replayed", id: resolution.id };
    const prepared = prepareOrder(request, [product], resolution.hash);
    if (!prepared.ok) return { state: "unavailable" };
    const outcome = await insertPreparedOrder(prepared.value);
    if (outcome.status === "created") {
      // The same created-only dispatch as the public order API; failure cannot alter insert success.
      await notifyCreatedOrder({ requestId: outcome.id, createdAt: outcome.createdAt, order: prepared.value });
      return { state: "created", id: outcome.id, totalMinor: prepared.value.totalMinor };
    }
    if (outcome.status === "replayed") return { state: "replayed", id: outcome.id };
    return { state: "unavailable" };
  } catch {
    return { state: "unavailable" };
  }
}

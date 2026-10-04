import type { PublicProduct } from "@/lib/catalog/types";
import type { ValidatedOrderRequest } from "./validate-request";

// Temporary T055 Preview review fixture. No catalog or media row is created.
export const TECHNICAL_FLOW_PRODUCT: PublicProduct = {
  id: "d6e6d744-e8e8-4930-9ae9-5263fa558411",
  sku: "TEST_ONLY-T055", slug: "technical-order-flow-review",
  name: "Технический образец T055", series: null,
  priceMinor: 200000, currency: "RUB", priceUnit: "м²", saleUnit: "sheet",
  minQuantity: 1, quantityStep: 2, areaPerSaleUnitM2: 4.0328,
  sourcePriceRange: null, availabilityStatus: "in_stock", isFeatured: false,
  sortOrder: 0, categories: [], primaryImage: null,
};

export const TECHNICAL_FLOW_KEYS = {
  positive: "82a9dfd6-4e63-46be-8afe-0527896b0451",
  changedPrice: "75fc88ee-2fd5-4e79-a5db-25bf42511ec6",
  changedUnit: "08664c34-2e3f-4d0f-8d13-eb1729d39222",
  invalidQuantity: "21304c0b-67c9-4c27-85e6-88eff70fb65c",
} as const;

export const TECHNICAL_FLOW_CONTACT = {
  name: "Тестовый пользователь", phone: "+7 900 000-00-00",
  city: "Тестовый город", email: "test@example.test", comment: "Тестовая интеграционная заявка",
} as const;

export function technicalFlowAllowed(request: ValidatedOrderRequest): boolean {
  return process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "t055-preview-review" &&
    Object.values(TECHNICAL_FLOW_KEYS).includes(request.idempotencyKey as typeof TECHNICAL_FLOW_KEYS[keyof typeof TECHNICAL_FLOW_KEYS]) &&
    Object.entries(TECHNICAL_FLOW_CONTACT).every(([key, value]) =>
      request.contact[key as keyof typeof request.contact] === value) &&
    request.items.length === 1 && request.items[0].productId === TECHNICAL_FLOW_PRODUCT.id;
}

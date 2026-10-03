import { evaluateCommerce, exactTotalMinor, validQuantity } from "@/lib/catalog/commerce";
import type { PublicProduct } from "@/lib/catalog/types";
import type { ValidatedOrderRequest } from "./validate-request";

export type VerifiedItem = {
  productId: string; sku: string; name: string; quantity: number;
  priceMinor: number; priceUnit: string; saleUnit: string;
  lineTotalMinor: number;
};

export type PreparedOrder = {
  contact: ValidatedOrderRequest["contact"];
  idempotencyKey: string;
  requestHash: string;
  items: VerifiedItem[];
  totalMinor: number;
  currency: "RUB";
};

export function prepareOrder(request: ValidatedOrderRequest, products: readonly PublicProduct[], requestHash: string):
  { ok: true; value: PreparedOrder } | { ok: false } {
  const byId = new Map(products.map((product) => [product.id.toLowerCase(), product]));
  if (byId.size !== request.items.length) return { ok: false };
  const verified: VerifiedItem[] = [];
  let sum = BigInt(0);
  for (const line of request.items) {
    const product = byId.get(line.productId);
    if (!product) return { ok: false };
    // Public guest/RLS read already excludes hidden/draft/archived/TEST_ONLY rows.
    const model = evaluateCommerce(product, true);
    if (model?.commercialStatus !== "ready" || !validQuantity(model, line.quantity) ||
        product.priceMinor !== line.displayedPriceMinor || product.priceUnit !== line.displayedPriceUnit ||
        product.saleUnit !== line.displayedSaleUnit || product.currency !== "RUB" ||
        product.priceMinor === null || product.priceUnit === null || product.saleUnit === null) return { ok: false };
    const lineTotalMinor = exactTotalMinor(model, line.quantity);
    if (lineTotalMinor === null) return { ok: false };
    sum += BigInt(lineTotalMinor);
    if (sum > BigInt(Number.MAX_SAFE_INTEGER)) return { ok: false };
    verified.push({
      productId: product.id, sku: product.sku, name: product.name, quantity: line.quantity,
      priceMinor: product.priceMinor, priceUnit: product.priceUnit, saleUnit: product.saleUnit,
      lineTotalMinor,
    });
  }
  return { ok: true, value: {
    contact: request.contact, idempotencyKey: request.idempotencyKey, requestHash,
    items: verified, totalMinor: Number(sum), currency: "RUB",
  } };
}

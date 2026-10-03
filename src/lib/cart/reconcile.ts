import { evaluateCommerce, exactTotalMinor, validQuantity, type QuantityViewModel } from "@/lib/catalog/commerce";
import type { PublicProduct } from "@/lib/catalog/types";
import type { CartDisplaySnapshot, CartLine } from "./model";

export type ReconciledLine = {
  line: CartLine;
  product: PublicProduct | null;
  model: QuantityViewModel | null;
  status: "ready" | "price_or_unit_changed" | "invalid_quantity" | "unavailable" | "missing";
  lineTotalMinor: number | null;
};

export function currentSnapshot(product: PublicProduct): CartDisplaySnapshot {
  return {
    name: product.name, primaryImageUrl: product.primaryImage?.url ?? null,
    priceMinor: product.priceMinor, currency: product.currency,
    priceUnit: product.priceUnit, saleUnit: product.saleUnit,
  };
}

export function commercialFactsChanged(snapshot: CartDisplaySnapshot | undefined, product: PublicProduct): boolean {
  // Unknown old price is not consent to a current price. Name and image changes are non-commercial.
  return snapshot?.priceMinor == null || snapshot.priceMinor !== product.priceMinor ||
    snapshot.currency !== product.currency || snapshot.priceUnit !== product.priceUnit ||
    snapshot.saleUnit !== product.saleUnit;
}

export function reconcileLines(lines: readonly CartLine[], products: readonly PublicProduct[]): {
  lines: ReconciledLine[]; totalMinor: number | null;
} {
  const byId = new Map(products.map((product) => [product.id, product]));
  const result = lines.map((line): ReconciledLine => {
    const product = byId.get(line.productId) ?? null;
    if (!product) return { line, product: null, model: null, status: "missing", lineTotalMinor: null };
    const model = evaluateCommerce(product, true);
    if (model?.commercialStatus !== "ready") {
      return { line, product, model, status: "unavailable", lineTotalMinor: null };
    }
    if (!validQuantity(model, line.quantity)) {
      return { line, product, model, status: "invalid_quantity", lineTotalMinor: null };
    }
    const lineTotalMinor = exactTotalMinor(model, line.quantity);
    if (lineTotalMinor === null) return { line, product, model, status: "unavailable", lineTotalMinor: null };
    return { line, product, model,
      status: commercialFactsChanged(line.snapshot, product) ? "price_or_unit_changed" : "ready",
      lineTotalMinor };
  });
  if (!result.length || result.some((entry) => entry.status !== "ready" || entry.lineTotalMinor === null)) {
    return { lines: result, totalMinor: null };
  }
  const sum = result.reduce((total, entry) => total + BigInt(entry.lineTotalMinor!), BigInt(0));
  return { lines: result, totalMinor: sum <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(sum) : null };
}

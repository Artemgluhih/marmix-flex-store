import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import type { ValidatedOrderRequest } from "./validate-request";

// Arrays fix the field order; item sorting makes JSON key and cart order irrelevant.
// The idempotency key identifies the slot, but does not define its contents.
export function canonicalRequestHash(request: ValidatedOrderRequest): string {
  const { contact } = request;
  const items = request.items.map((item) => [
    item.productId, item.quantity, item.displayedPriceMinor,
    item.displayedPriceUnit, item.displayedSaleUnit,
  ]).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  const canonical = JSON.stringify([
    request.version, contact.name, contact.phone, contact.city, contact.email, contact.comment, items,
  ]);
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function sameStoredHash(stored: unknown, digest: string): boolean {
  // PostgREST serializes PostgreSQL bytea in hex form. Unknown encodings fail closed.
  if (typeof stored !== "string" || !/^\\x[0-9a-f]{64}$/i.test(stored) || !/^[0-9a-f]{64}$/.test(digest)) return false;
  return timingSafeEqual(Buffer.from(stored.slice(2), "hex"), Buffer.from(digest, "hex"));
}

export function hashForBytea(digest: string): string {
  if (!/^[0-9a-f]{64}$/.test(digest)) throw new Error("Invalid digest.");
  return `\\x${digest}`;
}

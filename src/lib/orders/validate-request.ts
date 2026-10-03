import { FORM_LIMITS, validateField } from "@/app/(public)/checkout/form";
import { MAX_DISPLAY_QUANTITY } from "@/lib/catalog/commerce";

// Transport limits, not commercial limits. Current product rules are checked in T053.
export const MAX_ORDER_ITEMS = 50;
export const MAX_ORDER_BODY_BYTES = 16 * 1024;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROOT_KEYS = ["version", "idempotency_key", "name", "phone", "city", "email", "comment", "items"];
const ITEM_KEYS = ["product_id", "quantity", "price_minor", "price_unit", "sale_unit"];

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype;
}

function exactKeys(value: Record<string, unknown>, allowed: string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

export type ValidatedOrderRequest = {
  version: 1;
  idempotencyKey: string;
  contact: { name: string; phone: string; city: string; email: string; comment: string };
  items: { productId: string; quantity: number; displayedPriceMinor: number;
    displayedPriceUnit: string; displayedSaleUnit: string }[];
};

export type ValidationResult =
  | { ok: true; value: ValidatedOrderRequest }
  | { ok: false; fields: string[] };

export function validateOrderRequest(input: unknown): ValidationResult {
  if (!record(input) || !exactKeys(input, ROOT_KEYS)) return { ok: false, fields: [] };

  const fields: string[] = [];
  if (input.version !== 1) fields.push("version");
  if (typeof input.idempotency_key !== "string" || !UUID.test(input.idempotency_key)) fields.push("idempotency_key");

  const contact = {} as ValidatedOrderRequest["contact"];
  for (const field of Object.keys(FORM_LIMITS) as (keyof typeof FORM_LIMITS)[]) {
    const raw = input[field];
    if (raw === undefined && field !== "name" && field !== "phone") {
      contact[field] = "";
      continue;
    }
    if (typeof raw !== "string" || validateField(field, raw)) {
      fields.push(field);
      continue;
    }
    contact[field] = raw.trim();
  }

  const items: ValidatedOrderRequest["items"] = [];
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > MAX_ORDER_ITEMS) {
    fields.push("items");
  } else {
    const seen = new Set<string>();
    for (const [index, item] of input.items.entries()) {
      if (!record(item) || !exactKeys(item, ITEM_KEYS)) {
        fields.push(`items[${index}]`);
        continue;
      }
      if (typeof item.product_id !== "string" || !UUID.test(item.product_id)) {
        fields.push(`items[${index}].product_id`);
      } else {
        const productId = item.product_id.toLowerCase();
        if (seen.has(productId)) fields.push(`items[${index}].product_id`);
        seen.add(productId);
      }
      if (typeof item.quantity !== "number" || !Number.isSafeInteger(item.quantity) ||
          item.quantity < 1 || item.quantity > MAX_DISPLAY_QUANTITY) fields.push(`items[${index}].quantity`);
      if (typeof item.price_minor !== "number" || !Number.isSafeInteger(item.price_minor) ||
          item.price_minor < 0) fields.push(`items[${index}].price_minor`);
      // These are untrusted facts shown to the buyer, not authority for a sale.
      if (typeof item.price_unit !== "string" || !item.price_unit.trim() || item.price_unit.length > 80)
        fields.push(`items[${index}].price_unit`);
      if (typeof item.sale_unit !== "string" || !item.sale_unit.trim() || item.sale_unit.length > 80)
        fields.push(`items[${index}].sale_unit`);
      if (fields.length === 0) items.push({
        productId: (item.product_id as string).toLowerCase(),
        quantity: item.quantity as number,
        displayedPriceMinor: item.price_minor as number,
        displayedPriceUnit: (item.price_unit as string).trim(),
        displayedSaleUnit: (item.sale_unit as string).trim(),
      });
    }
  }
  if (fields.length) return { ok: false, fields };
  return { ok: true, value: {
    version: 1,
    idempotencyKey: (input.idempotency_key as string).toLowerCase(),
    contact,
    items,
  } };
}

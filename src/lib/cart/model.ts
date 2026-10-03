import { MAX_DISPLAY_QUANTITY, validQuantity, type QuantityViewModel } from "@/lib/catalog/commerce";

export const CART_VERSION = 1 as const;

// Browser snapshots are stale, untrusted presentation data. Never use them for
// orderability, authoritative prices, checkout totals, or order snapshots.
export type CartDisplaySnapshot = Readonly<{
  name?: string;
  primaryImageUrl?: string | null;
  priceMinor?: number | null;
  currency?: string;
  priceUnit?: string | null;
  saleUnit?: string | null;
}>;

export type CartLine = Readonly<{
  productId: string;
  quantity: number; // Count of sale units (sheets for panels), never square metres.
  snapshot?: CartDisplaySnapshot;
}>;

export type CartState = Readonly<{
  version: typeof CART_VERSION;
  lines: readonly CartLine[];
}>;

export type CartQuantityRule = Pick<QuantityViewModel, "min" | "step" | "max">;

export const EMPTY_CART: CartState = Object.freeze({ version: CART_VERSION, lines: Object.freeze([]) });

export type CartResult =
  | { ok: true; state: CartState; changed: boolean }
  | { ok: false; state: CartState; changed: false; reason: "invalid_product_id" | "invalid_quantity" | "line_not_found" };

function validProductId(productId: string): boolean {
  return typeof productId === "string" && productId.length > 0 && productId.trim() === productId;
}

function validRule(rule: CartQuantityRule): boolean {
  return rule !== null && typeof rule === "object" &&
    Number.isSafeInteger(rule.min) && rule.min >= 1 && rule.min <= MAX_DISPLAY_QUANTITY &&
    Number.isSafeInteger(rule.step) && rule.step >= 1 &&
    Number.isSafeInteger(rule.max) &&
    rule.max === rule.min + Math.floor((MAX_DISPLAY_QUANTITY - rule.min) / rule.step) * rule.step;
}

function validTarget(rule: CartQuantityRule, quantity: unknown): quantity is number {
  return validRule(rule) && validQuantity(rule, quantity);
}

function copySnapshot(snapshot: CartDisplaySnapshot): CartDisplaySnapshot {
  const result: {
    -readonly [K in keyof CartDisplaySnapshot]?: CartDisplaySnapshot[K]
  } = {};
  for (const key of ["name", "primaryImageUrl", "priceMinor", "currency", "priceUnit", "saleUnit"] as const) {
    if (snapshot[key] !== undefined) {
      // Values are primitives; copying only these fields also drops extra DTO keys.
      (result as Record<string, unknown>)[key] = snapshot[key];
    }
  }
  return result;
}

function sameSnapshot(left: CartDisplaySnapshot | undefined, right: CartDisplaySnapshot | undefined): boolean {
  if (left === right) return true;
  if (!left || !right) return false;
  return left.name === right.name && left.primaryImageUrl === right.primaryImageUrl &&
    left.priceMinor === right.priceMinor && left.currency === right.currency &&
    left.priceUnit === right.priceUnit && left.saleUnit === right.saleUnit;
}

// Target quantity, not an increment: repeating the same command is idempotent.
export function upsertLine(
  state: CartState,
  command: { productId: string; quantity: unknown; snapshot?: CartDisplaySnapshot },
  rule: CartQuantityRule,
): CartResult {
  if (!validProductId(command.productId)) return { ok: false, state, changed: false, reason: "invalid_product_id" };
  if (!validTarget(rule, command.quantity)) return { ok: false, state, changed: false, reason: "invalid_quantity" };

  const index = state.lines.findIndex((line) => line.productId === command.productId);
  const current = state.lines[index];
  const snapshot = command.snapshot === undefined ? current?.snapshot : copySnapshot(command.snapshot);
  if (current && current.quantity === command.quantity && sameSnapshot(current.snapshot, snapshot)) {
    return { ok: true, state, changed: false };
  }

  const line: CartLine = {
    productId: command.productId,
    quantity: command.quantity,
    ...(snapshot === undefined ? {} : { snapshot }),
  };
  const lines = index < 0
    ? [...state.lines, line]
    : state.lines.map((existing, position) => position === index ? line : existing);
  return { ok: true, state: { version: CART_VERSION, lines }, changed: true };
}

export function updateQuantity(
  state: CartState,
  productId: string,
  quantity: unknown,
  rule: CartQuantityRule,
): CartResult {
  if (!validProductId(productId)) return { ok: false, state, changed: false, reason: "invalid_product_id" };
  const index = state.lines.findIndex((line) => line.productId === productId);
  if (index < 0) return { ok: false, state, changed: false, reason: "line_not_found" };
  if (!validTarget(rule, quantity)) return { ok: false, state, changed: false, reason: "invalid_quantity" };
  if (state.lines[index].quantity === quantity) return { ok: true, state, changed: false };
  const lines = state.lines.map((line, position) => position === index ? { ...line, quantity } : line);
  return { ok: true, state: { version: CART_VERSION, lines }, changed: true };
}

export function removeLine(state: CartState, productId: string): CartResult {
  if (!validProductId(productId)) return { ok: false, state, changed: false, reason: "invalid_product_id" };
  const index = state.lines.findIndex((line) => line.productId === productId);
  if (index < 0) return { ok: true, state, changed: false };
  return {
    ok: true,
    state: { version: CART_VERSION, lines: state.lines.filter((_, position) => position !== index) },
    changed: true,
  };
}

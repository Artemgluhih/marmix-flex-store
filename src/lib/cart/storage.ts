import { MAX_DISPLAY_QUANTITY } from "@/lib/catalog/commerce";
import { CART_VERSION, EMPTY_CART, type CartDisplaySnapshot, type CartLine, type CartState } from "./model";

export const CART_STORAGE_KEY = "marmix-flex:cart";
// Technical bounds for hostile browser data, not commercial cart limits.
const MAX_PAYLOAD_LENGTH = 64 * 1024;
const MAX_STORED_LINES = 256;

type Recovery = "none" | "storage_recovered" | "storage_unavailable";
export type CartRead = { state: CartState; recovery: Recovery };
export type CartStorage = Pick<Storage, "getItem" | "setItem">;

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, limit: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= limit;
}

function decodeSnapshot(value: unknown): { snapshot?: CartDisplaySnapshot; changed: boolean } {
  if (!record(value)) return { changed: true };
  const snapshot: {
    -readonly [K in keyof CartDisplaySnapshot]?: CartDisplaySnapshot[K]
  } = {};
  let changed = false;
  const fields = ["name", "primaryImageUrl", "priceMinor", "currency", "priceUnit", "saleUnit"] as const;
  for (const key of fields) {
    if (!(key in value)) continue;
    const item = value[key];
    const valid = key === "priceMinor"
      ? item === null || (typeof item === "number" && Number.isSafeInteger(item) && item >= 0)
      : key === "primaryImageUrl"
        ? item === null || text(item, 2048)
        : key === "name" ? text(item, 240)
          : key === "currency" ? text(item, 8)
            : item === null || text(item, 80);
    if (valid) (snapshot as Record<string, unknown>)[key] = item;
    else changed = true;
  }
  if (Object.keys(value).some((key) => !fields.includes(key as typeof fields[number]))) changed = true;
  return { snapshot: Object.keys(snapshot).length ? snapshot : undefined, changed };
}

// Explicit version entry point for a future v1 → v2 migration. Unknown formats reset.
export function decodeCart(raw: string | null): CartRead {
  if (raw === null) return { state: EMPTY_CART, recovery: "none" };
  if (raw.length > MAX_PAYLOAD_LENGTH) return { state: EMPTY_CART, recovery: "storage_recovered" };
  let payload: unknown;
  try { payload = JSON.parse(raw); }
  catch { return { state: EMPTY_CART, recovery: "storage_recovered" }; }
  if (!record(payload) || payload.version !== CART_VERSION || !Array.isArray(payload.lines) ||
      payload.lines.length > MAX_STORED_LINES) {
    return { state: EMPTY_CART, recovery: "storage_recovered" };
  }

  const lines: CartLine[] = [];
  const position = new Map<string, number>();
  let changed = Object.keys(payload).some((key) => key !== "version" && key !== "lines");
  for (const input of payload.lines) {
    if (!record(input) || !text(input.productId, 256) || input.productId.trim() !== input.productId ||
        typeof input.quantity !== "number" || !Number.isSafeInteger(input.quantity) ||
        input.quantity < 1 || input.quantity > MAX_DISPLAY_QUANTITY) {
      changed = true;
      continue;
    }
    const decoded = "snapshot" in input ? decodeSnapshot(input.snapshot) : { changed: false };
    changed ||= decoded.changed || Object.keys(input).some((key) => key !== "productId" && key !== "quantity" && key !== "snapshot");
    const line: CartLine = { productId: input.productId, quantity: input.quantity,
      ...(decoded.snapshot === undefined ? {} : { snapshot: decoded.snapshot }) };
    const existing = position.get(line.productId);
    if (existing === undefined) {
      position.set(line.productId, lines.length);
      lines.push(line);
    } else {
      lines[existing] = line; // Latest valid target wins; keep first position, never add quantities.
      changed = true;
    }
  }
  return { state: { version: CART_VERSION, lines }, recovery: changed ? "storage_recovered" : "none" };
}

export function readCart(storage: Pick<CartStorage, "getItem"> | null): CartRead {
  if (!storage) return { state: EMPTY_CART, recovery: "storage_unavailable" };
  try { return decodeCart(storage.getItem(CART_STORAGE_KEY)); }
  catch { return { state: EMPTY_CART, recovery: "storage_unavailable" }; }
}

export function writeCart(storage: Pick<CartStorage, "setItem"> | null, state: CartState): boolean {
  if (!storage) return false;
  try {
    storage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch { return false; }
}

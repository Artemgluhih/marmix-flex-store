import "server-only";

import { createOrderSecretSupabaseClient } from "@/lib/supabase/secret";
import { hashForBytea, sameStoredHash } from "./canonical";
import { lookupExistingOrder } from "./idempotency";
import type { PreparedOrder } from "./prepare";

export type InsertOutcome = { status: "created" | "replayed"; id: string } |
  { status: "conflict" } | { status: "unavailable" };

function nullable(value: string): string | null { return value || null; }

export function orderInsertValues(prepared: PreparedOrder, consentAt: string) {
  return {
    idempotency_key: prepared.idempotencyKey,
    request_hash: hashForBytea(prepared.requestHash),
    name: prepared.contact.name,
    phone: prepared.contact.phone,
    city: nullable(prepared.contact.city),
    email: nullable(prepared.contact.email),
    comment: nullable(prepared.contact.comment),
    consent_at: consentAt,
    items_snapshot: prepared.items.map((item) => ({
      product_id: item.productId, sku: item.sku, name: item.name, quantity: item.quantity,
      sale_unit: item.saleUnit, price_minor: item.priceMinor, price_unit: item.priceUnit,
      line_total_minor: item.lineTotalMinor,
    })),
    total_minor: prepared.totalMinor,
    currency: prepared.currency,
  };
}

export async function insertPreparedOrder(prepared: PreparedOrder): Promise<InsertOutcome> {
  try {
    const client = createOrderSecretSupabaseClient();
    const { data, error } = await client.from("order_requests")
      .insert(orderInsertValues(prepared, new Date().toISOString())).select("id").single();
    if (!error && data?.id) return { status: "created", id: data.id };
    if (error?.code !== "23505") {
      if (process.env.VERCEL_ENV === "preview") console.error("T054_INSERT_CODE", error?.code ?? "NO_CODE");
      return { status: "unavailable" };
    }
    // UNIQUE(idempotency_key) is the final guard after two concurrent pre-checks.
    const existing = await lookupExistingOrder(prepared.idempotencyKey);
    if (!existing) return { status: "unavailable" };
    return sameStoredHash(existing.request_hash, prepared.requestHash)
      ? { status: "replayed", id: existing.id } : { status: "conflict" };
  } catch {
    if (process.env.VERCEL_ENV === "preview") console.error("T054_INSERT_CODE", "EXCEPTION");
    return { status: "unavailable" };
  }
}

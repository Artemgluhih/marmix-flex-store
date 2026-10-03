import "server-only";

import { canonicalRequestHash, sameStoredHash } from "./canonical";
import { createOrderSecretSupabaseClient } from "@/lib/supabase/secret";
import type { ValidatedOrderRequest } from "./validate-request";

export type ExistingOrder = { id: string; request_hash: string } | null;
export type IdempotencyResolution = { status: "new"; hash: string } |
  { status: "same"; id: string } | { status: "conflict" };

export function resolveIdempotency(request: ValidatedOrderRequest, existing: ExistingOrder): IdempotencyResolution {
  const hash = canonicalRequestHash(request);
  if (!existing) return { status: "new", hash };
  return sameStoredHash(existing.request_hash, hash)
    ? { status: "same", id: existing.id } : { status: "conflict" };
}

// Called before a fresh read and reusable after T054's unique-key insert conflict.
export async function lookupExistingOrder(key: string): Promise<ExistingOrder> {
  const client = createOrderSecretSupabaseClient();
  const { data, error } = await client.from("order_requests")
    .select("id,request_hash").eq("idempotency_key", key).maybeSingle();
  if (error) throw new Error("Private order lookup unavailable.");
  return data;
}

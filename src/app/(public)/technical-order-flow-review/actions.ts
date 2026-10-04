"use server";

import { TECHNICAL_FLOW_PRODUCT } from "@/lib/orders/technical-flow-fixture";

// Isolated technical fresh read. Public guest/RLS catalog reads remain unchanged.
export async function refreshTechnicalFlowProduct(ids: unknown) {
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.VERCEL_GIT_COMMIT_REF !== "t055-preview-review" ||
      !Array.isArray(ids) || ids.length !== 1 || ids[0] !== TECHNICAL_FLOW_PRODUCT.id) {
    throw new Error("Technical refresh unavailable.");
  }
  return [TECHNICAL_FLOW_PRODUCT];
}

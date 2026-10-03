"use client";

import { useCart } from "@/lib/cart/CartProvider";
import type { CartDisplaySnapshot } from "@/lib/cart/model";
import type { QuantityViewModel } from "@/lib/catalog/commerce";

export function TechnicalCartControls({ productId, model, snapshot }: {
  productId: string; model: QuantityViewModel; snapshot: CartDisplaySnapshot;
}) {
  const { state, hydrationStatus, upsert, remove } = useCart();
  const line = state.lines.find((item) => item.productId === productId);
  return <div style={{ margin: "24px 0 42px", display: "grid", gap: 12 }}>
    <p>Hydration: <output data-testid="hydration">{hydrationStatus}</output></p>
    <p>Technical line: <output data-testid="technical-line">{line ? `${line.productId}:${line.quantity}` : "empty"}</output></p>
    <p>Cart positions: <output data-testid="positions">{hydrationStatus === "ready" ? state.lines.length : "loading"}</output></p>
    <button type="button" disabled={hydrationStatus !== "ready"}
      onClick={() => upsert(productId, model.min, model, snapshot)}>Repeat Add target minimum</button>
    <button type="button" disabled={hydrationStatus !== "ready"}
      onClick={() => remove(productId)}>Cleanup technical fixture line</button>
  </div>;
}

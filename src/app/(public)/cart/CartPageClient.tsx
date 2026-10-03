"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart/CartProvider";
import { currentSnapshot } from "@/lib/cart/reconcile";
import type { PublicProduct } from "@/lib/catalog/types";
import { CartContent } from "./CartContent";
import { refreshCartProducts } from "./actions";

type Refresh = { key: string; products: PublicProduct[]; error: boolean };

export function CartPageClient() {
  const { state, hydrationStatus, upsert, update, remove } = useCart();
  const [attempt, setAttempt] = useState(0);
  const [refresh, setRefresh] = useState<Refresh | null>(null);
  const idsKey = JSON.stringify(state.lines.map((line) => line.productId));
  const key = `${idsKey}:${attempt}`;

  useEffect(() => {
    if (hydrationStatus !== "ready" || idsKey === "[]") return;
    let active = true;
    refreshCartProducts(JSON.parse(idsKey))
      .then((products) => { if (active) setRefresh({ key, products, error: false }); })
      .catch(() => { if (active) setRefresh({ key, products: [], error: true }); });
    return () => { active = false; };
  }, [hydrationStatus, idsKey, key]);

  return <CartContent lines={state.lines} products={refresh?.key === key ? refresh.products : []}
    phase={hydrationStatus !== "ready" ? "hydrating" : !state.lines.length ? "empty" : refresh?.key !== key ? "refreshing" : refresh.error ? "error" : "ready"}
    onRetry={() => setAttempt((value) => value + 1)}
    onUpdate={update} onRemove={remove}
    onConfirm={(product, model, quantity) => upsert(product.id, quantity, model, currentSnapshot(product))} />;
}

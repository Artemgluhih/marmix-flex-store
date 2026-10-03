"use client";

import { useCart } from "@/lib/cart/CartProvider";
import { currentSnapshot } from "@/lib/cart/reconcile";
import { useFreshCartProducts } from "@/lib/cart/useFreshCartProducts";
import { CartContent } from "./CartContent";

export function CartPageClient() {
  const { state, hydrationStatus, upsert, update, remove } = useCart();
  const { products, phase, retry } = useFreshCartProducts(state.lines, hydrationStatus);

  return <CartContent lines={state.lines} products={products} phase={phase}
    onRetry={retry}
    onUpdate={update} onRemove={remove}
    onConfirm={(product, model, quantity) => upsert(product.id, quantity, model, currentSnapshot(product))} />;
}

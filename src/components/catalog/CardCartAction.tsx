"use client";

import { useCart } from "@/lib/cart/CartProvider";
import type { CartDisplaySnapshot } from "@/lib/cart/model";
import type { QuantityViewModel } from "@/lib/catalog/commerce";
import styles from "./ProductGrid.module.css";

export function CardCartAction({ productId, name, model, snapshot }: {
  productId: string;
  name: string;
  model: QuantityViewModel;
  snapshot: CartDisplaySnapshot;
}) {
  const { state, hydrationStatus, upsert } = useCart();
  const ready = hydrationStatus === "ready" && model.commercialStatus === "ready";
  const inCart = ready && state.lines.some((line) => line.productId === productId);
  return <button type="button" className={styles.cartAction} disabled={!ready || inCart}
    aria-label={inCart ? `${name} в корзине` : `Добавить ${name} в корзину`}
    title={inCart ? "В корзине" : "Добавить в корзину"}
    onClick={() => { if (ready && !inCart) upsert(productId, model.min, model, snapshot); }}>
    <span aria-hidden="true">{inCart ? "✓" : "+"}</span>
  </button>;
}

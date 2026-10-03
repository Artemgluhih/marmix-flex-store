"use client";

import { useCart } from "@/lib/cart/CartProvider";
import Link from "next/link";
import styles from "./CartStatus.module.css";

export function CartStatus() {
  const { state, hydrationStatus } = useCart();
  const ready = hydrationStatus === "ready";
  const count = state.lines.length; // Positions, not a sum of mixed sale-unit quantities.
  return <Link href="/cart" className={styles.status} aria-live="off"
    aria-label={ready ? `Корзина: ${count} позиций` : "Корзина: загрузка"}>
    Корзина<span className={styles.count}>{ready ? ` · ${count}` : ""}</span>
  </Link>;
}

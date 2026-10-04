"use client";

import Link from "next/link";
import { reconcileLines } from "@/lib/cart/reconcile";
import type { CartLine } from "@/lib/cart/model";
import type { CartRefreshPhase } from "@/lib/cart/useFreshCartProducts";
import type { PublicProduct } from "@/lib/catalog/types";
import { CheckoutForm } from "./CheckoutForm";
import styles from "./checkout.module.css";

type Props = {
  lines: readonly CartLine[];
  products: readonly PublicProduct[];
  phase: CartRefreshPhase;
  technical?: boolean;
  technicalFormState?: "normal" | "validating" | "error";
};

function money(minor: number) {
  const amount = BigInt(minor);
  const whole = new Intl.NumberFormat("ru-RU").format(amount / BigInt(100));
  const cents = amount % BigInt(100);
  return `${whole}${cents ? `,${cents.toString().padStart(2, "0")}` : ""} ₽`;
}

export function CheckoutContent({ lines, products, phase, technical, technicalFormState }: Props) {
  if (phase === "hydrating" || phase === "refreshing") return <div className={styles.state} role="status">
    <h2>Проверяем корзину</h2><p>{phase === "hydrating" ? "Загружаем позиции…" : "Уточняем текущие данные товаров…"}</p>
  </div>;
  if (phase === "empty") return <div className={styles.state} role="status">
    <h2>Корзина пуста</h2><p>Для заявки нужны позиции в корзине.</p><Link href="/catalog">Перейти в каталог</Link>
  </div>;
  if (phase === "error") return <div className={styles.state} role="alert">
    <h2>Не удалось проверить корзину</h2><p>Текущие позиции и итог пока недоступны. Проверьте их в корзине.</p>
    <Link href="/cart">Вернуться в корзину</Link>
  </div>;

  const result = reconcileLines(lines, products);
  if (result.totalMinor === null || result.lines.some((entry) => entry.status !== "ready")) {
    return <div className={styles.state} role="status">
      <h2>Корзина требует проверки</h2>
      <p>Одна или несколько позиций недоступны, количество изменилось либо текущая цена или единица ещё не подтверждены.</p>
      <Link href="/cart">Вернуться в корзину</Link>
    </div>;
  }

  return <div className={styles.layout}>
    <CheckoutForm technical={technical} technicalState={technicalFormState} />
    <aside className={styles.summary} aria-labelledby="checkout-summary-title">
      <h2 id="checkout-summary-title">Состав заявки</h2>
      <p className={styles.summaryLead}>Текущие данные товаров после проверки корзины.</p>
      <ul>{result.lines.map(({ line, product, lineTotalMinor }) => <li key={line.productId}>
        <strong>{product!.name}</strong>
        <span>{line.quantity} {product!.saleUnit === "sheet" ? "лист" : product!.saleUnit}</span>
        <span>{money(product!.priceMinor!)} / {product!.priceUnit}</span>
        <span className={styles.lineTotal}>{money(lineTotalMinor!)}</span>
      </li>)}</ul>
      <p className={styles.total}>Итого по текущим данным <strong>{money(result.totalMinor)}</strong></p>
      <p className={styles.summaryNote}>Перед отправкой заявки товары и цены будут проверены повторно.</p>
      <Link className={styles.back} href="/cart">Вернуться в корзину</Link>
    </aside>
  </div>;
}

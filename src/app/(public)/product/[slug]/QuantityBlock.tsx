"use client";

import { useId, useState } from "react";
import { exactArea, exactTotalMinor, validQuantity, type QuantityViewModel } from "@/lib/catalog/commerce";
import { useCart } from "@/lib/cart/CartProvider";
import type { CartDisplaySnapshot } from "@/lib/cart/model";
import styles from "./QuantityBlock.module.css";

function rublesFromMinor(minor: number): string {
  const cents = BigInt(minor);
  const whole = new Intl.NumberFormat("ru-RU").format(cents / BigInt(100));
  const fractional = cents % BigInt(100);
  return `${whole}${fractional ? `,${fractional.toString().padStart(2, "0")}` : ""} ₽`;
}

function sheetWord(quantity: number): string {
  if (quantity % 10 === 1 && quantity % 100 !== 11) return "лист";
  if ([2, 3, 4].includes(quantity % 10) && ![12, 13, 14].includes(quantity % 100)) return "листа";
  return "листов";
}

export function QuantityBlock({ model, productId, snapshot }: {
  model: QuantityViewModel;
  productId: string;
  snapshot: CartDisplaySnapshot;
}) {
  const labelId = useId();
  const { state, hydrationStatus, upsert, update, remove } = useCart();
  const [draft, setDraft] = useState<number | null>(null);
  const orderable = model.commercialStatus === "ready";
  const ready = hydrationStatus === "ready";
  const line = orderable && ready ? state.lines.find((item) => item.productId === productId) : undefined;
  const quantity = draft ?? (line && validQuantity(model, line.quantity) ? line.quantity : model.min);
  const area = exactArea(model, quantity);
  const totalMinor = exactTotalMinor(model, quantity);
  const inCart = line !== undefined;
  const matching = inCart && line.quantity === quantity;

  return (
    <div className={styles.block}>
      <div className={styles.quantityLine}>
        <span id={labelId} className={styles.label}>Количество, {model.saleUnit === "sheet" ? "лист" : model.saleUnit}</span>
        <div className={styles.controls} role="group" aria-labelledby={labelId}>
          <button type="button" aria-label="Уменьшить количество" disabled={quantity === model.min}
            onClick={() => setDraft(Math.max(model.min, quantity - model.step))}>−</button>
          <output className={styles.value} aria-live="polite" aria-atomic="true">{quantity}</output>
          <button type="button" aria-label="Увеличить количество" disabled={quantity === model.max}
            onClick={() => setDraft(Math.min(model.max, quantity + model.step))}>+</button>
        </div>
      </div>
      {area !== null && <p className={styles.area}>{quantity} {sheetWord(quantity)} = {area.replace(".", ",")} м²</p>}
      {totalMinor !== null && <p className={styles.total}>Итого: {rublesFromMinor(totalMinor)}</p>}
      <button type="button" className={styles.action} disabled={!orderable || !ready || matching}
        onClick={() => {
          if (!orderable || !ready || !validQuantity(model, quantity)) return;
          if (inCart) update(productId, quantity, model);
          else upsert(productId, quantity, model, snapshot);
        }}>
        {orderable && ready && inCart ? (matching ? "В корзине" : "Обновить количество") : "Добавить в корзину"}
      </button>
      {orderable && ready && inCart && <button type="button" className={styles.remove}
        onClick={() => { remove(productId); setDraft(null); }}>Удалить из корзины</button>}
      {!orderable && <p className={styles.reason}>Добавление в корзину сейчас недоступно.</p>}
    </div>
  );
}

"use client";

import { useId, useState } from "react";
import { exactArea, exactTotalMinor, type QuantityViewModel } from "@/lib/catalog/commerce";
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

export function QuantityBlock({ model }: { model: QuantityViewModel }) {
  const labelId = useId();
  const [quantity, setQuantity] = useState(model.min);
  const area = exactArea(model, quantity);
  const totalMinor = exactTotalMinor(model, quantity);

  return (
    <div className={styles.block}>
      <div className={styles.quantityLine}>
        <span id={labelId} className={styles.label}>Количество, {model.saleUnit === "sheet" ? "лист" : model.saleUnit}</span>
        <div className={styles.controls} role="group" aria-labelledby={labelId}>
          <button type="button" aria-label="Уменьшить количество" disabled={quantity === model.min}
            onClick={() => setQuantity((current) => Math.max(model.min, current - model.step))}>−</button>
          <output className={styles.value} aria-live="polite" aria-atomic="true">{quantity}</output>
          <button type="button" aria-label="Увеличить количество" disabled={quantity === model.max}
            onClick={() => setQuantity((current) => Math.min(model.max, current + model.step))}>+</button>
        </div>
      </div>
      {area !== null && <p className={styles.area}>{quantity} {sheetWord(quantity)} = {area.replace(".", ",")} м²</p>}
      {totalMinor !== null && <p className={styles.total}>Итого: {rublesFromMinor(totalMinor)}</p>}
      <button type="button" className={styles.action} disabled>Добавить в корзину</button>
      <p className={styles.reason}>{model.commercialStatus === "ready"
        ? "Добавление в корзину пока не подключено."
        : "Добавление в корзину сейчас недоступно."}</p>
    </div>
  );
}

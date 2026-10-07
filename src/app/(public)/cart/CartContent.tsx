"use client";

import Image from "next/image";
import Link from "next/link";
import { exactArea, type QuantityViewModel } from "@/lib/catalog/commerce";
import type { PublicProduct } from "@/lib/catalog/types";
import type { CartLine, CartQuantityRule } from "@/lib/cart/model";
import { reconcileLines, type ReconciledLine } from "@/lib/cart/reconcile";
import { TrackedCheckoutLink } from "@/lib/analytics/TrackedLinks";
import styles from "./cart.module.css";

export type CartPhase = "hydrating" | "empty" | "refreshing" | "error" | "ready";
type Props = {
  lines: readonly CartLine[];
  products: readonly PublicProduct[];
  phase: CartPhase;
  onRetry: () => void;
  onUpdate: (id: string, quantity: number, rule: CartQuantityRule) => void;
  onRemove: (id: string) => void;
  onConfirm: (product: PublicProduct, model: QuantityViewModel, quantity: number) => void;
  technical?: boolean;
};

function money(minor: number): string {
  const amount = BigInt(minor);
  const whole = new Intl.NumberFormat("ru-RU").format(amount / BigInt(100));
  const cents = amount % BigInt(100);
  return `${whole}${cents ? `,${cents.toString().padStart(2, "0")}` : ""} ₽`;
}

function itemName(entry: ReconciledLine): string {
  return entry.product?.name ?? entry.line.snapshot?.name ?? "Позиция корзины";
}

function Item({ entry, onUpdate, onRemove, onConfirm, technical }: Pick<Props, "onUpdate" | "onRemove" | "onConfirm" | "technical"> & { entry: ReconciledLine }) {
  const { product, model, line, status, lineTotalMinor } = entry;
  const name = itemName(entry);
  const quantityValid = !!model && line.quantity >= model.min && line.quantity <= model.max &&
    (line.quantity - model.min) % model.step === 0;
  const area = model && quantityValid ? exactArea(model, line.quantity) : null;
  return <li className={styles.item}>
    <div className={styles.media}>
      {product?.primaryImage && !technical ? <Link href={`/product/${product.slug}`} aria-label={`Открыть товар ${name}`}>
        <Image src={product.primaryImage.url} alt={product.primaryImage.alt ?? ""} fill sizes="(max-width: 620px) 92px, 120px" />
      </Link> : <span className={styles.noImage}>MARMIX FLEX</span>}
    </div>
    <div className={styles.details}>
      {product && !technical ? <Link href={`/product/${product.slug}`} className={styles.name}>{name}</Link>
        : <span className={styles.name}>{name}</span>}
      {product?.priceMinor != null && product.priceUnit && <p className={styles.price}>
        {money(product.priceMinor)} <span>/ {product.priceUnit}</span>
      </p>}
      {product?.saleUnit && <p className={styles.muted}>Единица продажи: {model?.saleUnit === "sheet" ? "лист" : product.saleUnit}</p>}
      {area !== null && <p className={styles.muted}>{line.quantity} лист = {area.replace(".", ",")} м²</p>}
      {status === "missing" && <p className={styles.warning} role="status">Позиция больше недоступна.</p>}
      {status === "unavailable" && <p className={styles.warning} role="status">Позиция сейчас недоступна для заказа.</p>}
      {status === "invalid_quantity" && model && <p className={styles.warning} role="status">
        Количество больше не соответствует условиям продажи. Минимум: {model.min}, шаг: {model.step}.
      </p>}
      {status === "price_or_unit_changed" && <p className={styles.warning} role="status">
        Цена или единица изменились с момента добавления. Проверьте актуальные данные.
      </p>}
      <div className={styles.actions}>
        {model && model.commercialStatus === "ready" ? <div className={styles.quantity} role="group" aria-label={`Количество: ${name}`}>
          <button type="button" aria-label={`Уменьшить количество: ${name}`} disabled={!quantityValid || line.quantity <= model.min}
            onClick={() => onUpdate(line.productId, line.quantity - model.step, model)}>−</button>
          <output aria-live="polite">{line.quantity}</output>
          <button type="button" aria-label={`Увеличить количество: ${name}`} disabled={!quantityValid || line.quantity >= model.max}
            onClick={() => onUpdate(line.productId, line.quantity + model.step, model)}>+</button>
        </div> : <span className={styles.muted}>Количество: {line.quantity}</span>}
        {status === "invalid_quantity" && model && <button type="button" className={styles.textAction}
          onClick={() => onUpdate(line.productId, model.min, model)}>Установить минимум {model.min}</button>}
        <button type="button" className={styles.textAction} aria-label={`Удалить из корзины: ${name}`}
          onClick={() => onRemove(line.productId)}>Удалить</button>
      </div>
      {status === "price_or_unit_changed" && product && model && <button type="button" className={styles.confirm}
        onClick={() => onConfirm(product, model, line.quantity)}>Подтвердить актуальную цену</button>}
    </div>
    <div className={styles.lineTotal}>
      {lineTotalMinor !== null && <><span>{status === "price_or_unit_changed" ? "Актуальная сумма" : "Сумма"}</span>
        <strong>{money(lineTotalMinor)}</strong></>}
    </div>
  </li>;
}

export function CartContent({ lines, products, phase, onRetry, onUpdate, onRemove, onConfirm, technical }: Props) {
  if (phase === "hydrating") return <div className={styles.state} role="status">Загружаем корзину…</div>;
  if (phase === "empty") return <div className={styles.state} role="status">
    <h2>Корзина пуста</h2><Link className={styles.catalogLink} href="/catalog">Перейти в каталог</Link>
  </div>;
  if (phase === "refreshing") return <div className={styles.state} role="status">Проверяем актуальные данные позиций…</div>;
  if (phase === "error") return <div className={styles.state} role="alert">
    <h2>Не удалось проверить позиции</h2><p>Ваши позиции сохранены в браузере. Итог пока недоступен.</p>
    <button type="button" className={styles.confirm} onClick={onRetry}>Повторить проверку</button>
    <ul className={styles.stale}>{lines.map((line) => <li key={line.productId}>
      <span>{line.snapshot?.name ?? "Позиция корзины"} · {line.quantity}</span>
      <button type="button" className={styles.textAction} aria-label={`Удалить из корзины: ${line.snapshot?.name ?? "Позиция корзины"}`}
        onClick={() => onRemove(line.productId)}>Удалить</button></li>)}</ul>
  </div>;

  const result = reconcileLines(lines, products);
  return <div className={styles.layout}>
    <div className={styles.listColumn}><h2 className={styles.sectionTitle}>Позиции · {lines.length}</h2>
      <ul className={styles.items}>{result.lines.map((entry) => <Item key={entry.line.productId}
        entry={entry} onUpdate={onUpdate} onRemove={onRemove} onConfirm={onConfirm} technical={technical} />)}</ul>
    </div>
    <aside className={styles.summary} aria-label="Сводка корзины">
      <h2>Сводка</h2><p>Позиций: {lines.length}</p>
      {result.totalMinor !== null ? <p className={styles.grandTotal}>Отображаемый итог <strong>{money(result.totalMinor)}</strong></p>
        : <p className={styles.unresolved} role="status">Итог станет доступен после проверки позиций.</p>}
      <p className={styles.note}>Перед отправкой заявки товары и цены будут проверены повторно.</p>
      <button type="button" className={styles.textAction} onClick={onRetry}>Обновить сведения</button>
      {result.totalMinor !== null && !technical && <TrackedCheckoutLink className={styles.catalogLink}>Перейти к заявке</TrackedCheckoutLink>}
    </aside>
  </div>;
}

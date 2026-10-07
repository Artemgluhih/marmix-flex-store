"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { productOrderVersion, moveProduct } from "./order-model";
import type { ProductOrderItem } from "./order-read";
import { saveProductOrder } from "./order-actions";
import styles from "./workflow.module.css";

export function ProductOrderList({ products }: { products: ProductOrderItem[] }) {
  const [rows, setRows] = useState(products);
  const [version, setVersion] = useState(productOrderVersion(products));
  const currentVersion = productOrderVersion(products);
  if (version !== currentVersion) { setVersion(currentVersion); setRows(products); }
  const [dragged, setDragged] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const dirty = rows.some((row, index) => row.id !== products[index]?.id || row.sort_order !== index);
  function move(from: number, to: number) {
    if (pending) return;
    const next = moveProduct(rows, from, to);
    if (next === rows) return;
    setRows(next); setMessage(`${rows[from].name}: позиция ${to + 1}. Изменения ещё не сохранены.`);
  }
  return <section className={styles.order} aria-label="Глобальный порядок активных товаров">
    <p>Все активные REAL товары — опубликованные и скрытые. Поиск, фильтры и пагинация в этом режиме не применяются. Порядок общий для каталога; главная показывает только избранные позиции.</p>
    <ol className={styles.orderList}>
      {rows.map((product, index) => <li key={product.id} className={dragged === product.id ? styles.dragged : undefined}
        onDragOver={(event) => { if (dragged && !pending) event.preventDefault(); }}
        onDrop={(event) => { event.preventDefault(); if (dragged) move(rows.findIndex((row) => row.id === dragged), index); setDragged(null); }}>
        <span className={styles.position}>{index + 1}</span>
        <div className={styles.product}><Link href={`/admin/products/${product.id}`}>{product.name}</Link><small>{product.sku}</small></div>
        <div className={styles.controls}>
          <button type="button" className={styles.dragHandle} draggable={!pending} disabled={pending} aria-label={`Перетащить товар «${product.name}»`}
            onDragStart={(event) => { setDragged(product.id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", product.id); }} onDragEnd={() => setDragged(null)}>⋮⋮</button>
          <button type="button" disabled={pending || index === 0} aria-label={`Переместить «${product.name}» вверх`} onClick={() => move(index, index - 1)}>↑</button>
          <button type="button" disabled={pending || index === rows.length - 1} aria-label={`Переместить «${product.name}» вниз`} onClick={() => move(index, index + 1)}>↓</button>
        </div>
      </li>)}
    </ol>
    {!rows.length && <p>Активных товаров пока нет. Архив доступен в обычном списке.</p>}
    <button className={styles.save} type="button" disabled={pending || !dirty} onClick={() => startTransition(async () => {
      try { const result = await saveProductOrder(rows.map(({ id }) => id), productOrderVersion(products)); setMessage(result.message); }
      catch { setMessage("Сохранение не подтверждено. Проверьте обновлённый порядок перед повторной попыткой."); }
      router.refresh();
    })}>{pending ? "Сохранение…" : "Сохранить порядок"}</button>
    <p role="status" aria-live="polite">{message}</p>
  </section>;
}

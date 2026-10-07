"use client";
import { useState } from "react";
import Link from "next/link";
import type { ProductOrderItem } from "../order-read";
import styles from "./navigator.module.css";

export function ProductNavigator({ products, current }: { products: ProductOrderItem[]; current: { id: string; name: string; sku: string } }) {
  const [query, setQuery] = useState("");
  const index = products.findIndex(({ id }) => id === current.id);
  const previous = index > 0 ? products[index - 1] : null;
  const next = index >= 0 ? products[index + 1] : null;
  const normalized = query.trim().toLocaleLowerCase("ru");
  const matches = products.filter(({ name, sku }) => `${name} ${sku}`.toLocaleLowerCase("ru").includes(normalized));
  const start = normalized ? 0 : Math.max(0, index - 20);
  const visible = matches.slice(start, start + 50);
  return <aside className={styles.navigator} aria-label="Переключение товаров">
    <div className={styles.current}><span>Текущий товар</span><strong>{current.name}</strong><small>{current.sku}</small></div>
    <p className={styles.notice}>Сохраните изменения перед переходом к другому товару.</p>
    <nav className={styles.adjacent} aria-label="Последовательное редактирование">
      {previous ? <Link href={`/admin/products/${previous.id}`}>← Предыдущий</Link> : <span aria-disabled="true">← Предыдущий</span>}
      {next ? <Link href={`/admin/products/${next.id}`}>Следующий →</Link> : <span aria-disabled="true">Следующий →</span>}
    </nav>
    <details className={styles.mobile}><summary>Перейти к товару</summary><nav aria-label="Мобильный список товаров">
      <label>Поиск по названию или SKU<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <ul>{visible.map((product) => <li key={product.id}><Link href={`/admin/products/${product.id}`} aria-current={product.id === current.id ? "page" : undefined}>{product.name}<small>{product.sku}</small></Link></li>)}</ul>
      {!visible.length && <p>Товары не найдены.</p>}{matches.length > 50 && <p>Показаны 50 результатов. Уточните поиск.</p>}
    </nav></details>
    <nav className={styles.desktop} aria-label="Товары в редакторе"><h2>Товары</h2>
      <label>Поиск по названию или SKU<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <ul>{visible.map((product) => <li key={product.id}><Link href={`/admin/products/${product.id}`} aria-current={product.id === current.id ? "page" : undefined}>{product.name}<small>{product.sku}</small></Link></li>)}</ul>
      {!visible.length && <p>Товары не найдены.</p>}{matches.length > 50 && <p>Показаны 50 результатов. Уточните поиск.</p>}
    </nav>
    <Link className={styles.archive} href="/admin/products?status=archived">Открыть архив</Link>
  </aside>;
}

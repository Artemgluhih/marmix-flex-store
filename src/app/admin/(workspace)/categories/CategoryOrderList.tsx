"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { categoryOrderVersion, moveCategory } from "./order-model";
import { saveCategoryOrder } from "./order-actions";
import styles from "./categories.module.css";

type Category = { id: string; name: string; slug: string; is_published: boolean; sort_order: number };

export function CategoryOrderList({ categories, selectedId, systemCount }: {
  categories: Category[]; selectedId?: string; systemCount: number;
}) {
  const [rows, setRows] = useState(categories);
  const [version, setVersion] = useState(categoryOrderVersion(categories));
  const currentVersion = categoryOrderVersion(categories);
  if (version !== currentVersion) {
    setVersion(currentVersion);
    setRows(categories);
  }
  const [dragged, setDragged] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const dirty = rows.some((row, index) => row.id !== categories[index]?.id || row.sort_order !== index);
  function move(from: number, to: number) {
    if (pending) return;
    const next = moveCategory(rows, from, to);
    if (next === rows) return;
    setRows(next);
    setMessage(`${rows[from].name}: позиция ${to + 1} среди пользовательских категорий. Порядок ещё не сохранён.`);
  }
  return <>
    <p className={styles.orderHint}>Перетаскивайте за маркер или используйте стрелки. Затем сохраните порядок.</p>
    <div className={styles.tableFrame}><table className={styles.table}>
      <thead><tr><th scope="col">Название</th><th scope="col">Slug</th><th scope="col">Статус</th><th scope="col">Порядок</th><th scope="col">Действие</th></tr></thead>
      <tbody>
        <tr><td data-label="Название" className={styles.name}>Все товары <span className={styles.systemBadge}>Системная</span><span className={styles.systemCount}>Товаров: {systemCount}</span></td>
          <td data-label="Slug" className={styles.slug}>/catalog</td><td data-label="Статус">Постоянно</td>
          <td data-label="Порядок">Всегда первая</td><td data-label="Действие">Недоступно для изменения</td></tr>
        {rows.map((category, index) => <tr key={category.id} className={dragged === category.id ? styles.dragged : undefined}
          onDragOver={(event) => { if (dragged && !pending) event.preventDefault(); }}
          onDrop={(event) => { event.preventDefault(); if (dragged) move(rows.findIndex((row) => row.id === dragged), index); setDragged(null); }}>
          <td data-label="Название" className={styles.name}>{category.name}</td>
          <td data-label="Slug" className={styles.slug}>{category.slug}</td>
          <td data-label="Статус"><span className={category.is_published ? styles.published : styles.hidden}>{category.is_published ? "Опубликована" : "Скрыта"}</span></td>
          <td data-label="Порядок"><span>{index}</span><div className={styles.orderControls}>
            <button type="button" className={styles.dragHandle} draggable={!pending} disabled={pending}
              aria-label={`Перетащить категорию «${category.name}»`} title="Перетащить"
              onDragStart={(event) => { setDragged(category.id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", category.id); }}
              onDragEnd={() => setDragged(null)}>⋮⋮</button>
            <button type="button" disabled={pending || index === 0} aria-label={`Переместить «${category.name}» вверх`} onClick={() => move(index, index - 1)}>↑</button>
            <button type="button" disabled={pending || index === rows.length - 1} aria-label={`Переместить «${category.name}» вниз`} onClick={() => move(index, index + 1)}>↓</button>
          </div></td>
          <td data-label="Действие"><Link aria-current={selectedId === category.id ? "true" : undefined} href={`/admin/categories?edit=${category.id}`}>Редактировать</Link></td>
        </tr>)}
      </tbody>
    </table></div>
    <div className={styles.orderActions}>
      <button type="button" disabled={pending || !dirty} onClick={() => startTransition(async () => {
        try {
          const result = await saveCategoryOrder(rows.map(({ id }) => id), categoryOrderVersion(categories));
          setMessage(result.message);
        } catch {
          setMessage("Сохранение не подтверждено. Список обновлён; проверьте порядок перед повторной попыткой.");
        }
        router.refresh();
      })}>{pending ? "Сохранение…" : "Сохранить порядок"}</button>
      <p role="status" aria-live="polite">{message}</p>
    </div>
  </>;
}

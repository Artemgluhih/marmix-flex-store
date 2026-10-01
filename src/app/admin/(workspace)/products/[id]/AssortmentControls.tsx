"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { changePublication, saveAssortment, type AssortmentState, type TransitionState } from "./assortment-actions";
import type { Transition } from "./assortment-validation";
import styles from "./assortment.module.css";

type ProductState = { id: string; is_published: boolean; archived_at: string | null; availability_status: string | null; is_featured: boolean; sort_order: number };

function Submit({ children, critical = false }: { children: React.ReactNode; critical?: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className={critical ? styles.critical : undefined}>{pending ? "Сохраняем…" : children}</button>;
}

function TransitionForm({ productId, command, label }: { productId: string; command: Transition; label: string }) {
  const [state, action] = useActionState(changePublication.bind(null, productId, command), {} as TransitionState);
  return <form action={action} className={styles.transition}>
    <Submit>{label}</Submit>
    {state.error && <p role="alert" className={styles.error}>{state.error}</p>}
  </form>;
}

function ArchiveForm({ productId }: { productId: string }) {
  const [state, action] = useActionState(changePublication.bind(null, productId, "archive"), {} as TransitionState);
  return <div className={styles.archive}>
    <details>
      <summary>Архивировать…</summary>
      <div className={styles.confirm}>
        <p>Товар будет скрыт с публичного сайта. SKU и данные сохранятся; товар можно восстановить.</p>
        <form action={action}><Submit critical>Да, архивировать и скрыть</Submit></form>
      </div>
    </details>
    {state.error && <p role="alert" className={styles.error}>{state.error}</p>}
  </div>;
}

export function AssortmentControls({ product }: { product: ProductState }) {
  const [state, action] = useActionState(saveAssortment.bind(null, product.id), {
    values: { availability: product.availability_status ?? "", featured: product.is_featured, sortOrder: String(product.sort_order) }, errors: {},
  } as AssortmentState);
  const archived = product.archived_at !== null;
  return <section className={styles.section} aria-labelledby="assortment-title">
    <header className={styles.header}>
      <h2 id="assortment-title">Публикация и ассортимент</h2>
      <p>Текущий статус: <strong>{archived ? "В архиве" : product.is_published ? "Опубликован" : "Скрыт"}</strong></p>
      <p>Для публикации выберите главное изображение и заполните alt и роль кадров. Неполные коммерческие данные не позволяют оформить заказ.</p>
    </header>
    <div className={styles.transitions}>
      {archived ? <><p>Сначала восстановите товар из архива, чтобы опубликовать его.</p><TransitionForm productId={product.id} command="restore" label="Восстановить" /></>
        : product.is_published ? <TransitionForm productId={product.id} command="unpublish" label="Снять с публикации" />
          : <TransitionForm productId={product.id} command="publish" label="Опубликовать" />}
    </div>
    <form action={action} className={styles.properties} noValidate>
      <div className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor="assortment-availability">Наличие</label>
          <select id="assortment-availability" name="availability" defaultValue={state.values.availability} key={state.values.availability} aria-invalid={Boolean(state.errors.availability)} aria-describedby={state.errors.availability ? "availability-error" : undefined}>
            <option value="">Не задано</option><option value="in_stock">В наличии</option><option value="on_order">Под заказ</option>
          </select>
          {state.errors.availability && <p id="availability-error" className={styles.error}>{state.errors.availability}</p>}
        </div>
        <div className={styles.field}>
          <label htmlFor="assortment-sort">Порядок показа</label>
          <input id="assortment-sort" name="sort_order" inputMode="numeric" defaultValue={state.values.sortOrder} key={state.values.sortOrder} aria-invalid={Boolean(state.errors.sort_order)} aria-describedby={state.errors.sort_order ? "sort-error" : undefined} />
          {state.errors.sort_order && <p id="sort-error" className={styles.error}>{state.errors.sort_order}</p>}
        </div>
      </div>
      <label className={styles.checkbox}><input type="checkbox" name="featured" defaultChecked={state.values.featured} key={String(state.values.featured)} /> Выделить товар</label>
      {state.errors.form && <p role="alert" className={styles.error}>{state.errors.form}</p>}
      <div className={styles.save}><Submit>Сохранить параметры ассортимента</Submit></div>
    </form>
    {!archived && <ArchiveForm productId={product.id} />}
  </section>;
}

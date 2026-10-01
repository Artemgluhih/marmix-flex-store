"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./category-multiselect.module.css";

type Category = { id: string; name: string };

export function CategoryMultiselect({ categories, selectedIds, error, errorId }: {
  categories: Category[];
  selectedIds: string[];
  error?: string;
  errorId?: string;
}) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(() => new Set(selectedIds));

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const names = categories.filter(({ id: categoryId }) => selected.has(categoryId)).map(({ name }) => name);
  const summary = categories.length === 0 ? "Категории пока не созданы"
    : names.length === 0 ? "Выберите категории"
      : names.length > 2 ? `Выбрано: ${names.length}` : names.join(", ");

  return <div className={styles.field} ref={rootRef} onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <span className={styles.label} id={`${id}-label`}>Категории</span>
    <button type="button" ref={triggerRef} className={styles.trigger}
      aria-labelledby={`${id}-label ${id}-summary`} aria-expanded={open}
      aria-controls={`${id}-options`} data-invalid={Boolean(error)}
      aria-describedby={`${id}-hint${error && errorId ? ` ${errorId}` : ""}`}
      disabled={categories.length === 0} onClick={() => setOpen((value) => !value)}>
      <span id={`${id}-summary`} className={styles.summary}>{summary}</span>
      <span aria-hidden="true" className={styles.chevron}>⌄</span>
    </button>
    <div className={styles.panel} id={`${id}-options`} role="group" aria-labelledby={`${id}-label`} hidden={!open}>
      {categories.map(({ id: categoryId, name }) => <label className={styles.option} key={categoryId}>
        <input type="checkbox" name="category_ids" value={categoryId} checked={selected.has(categoryId)}
          onChange={() => setSelected((current) => {
            const next = new Set(current);
            if (next.has(categoryId)) next.delete(categoryId); else next.add(categoryId);
            return next;
          })} />
        <span>{name}</span>
      </label>)}
    </div>
    <p className={styles.hint} id={`${id}-hint`}>{categories.length === 0
      ? "Товар всё равно будет доступен в «Все товары»."
      : "Можно выбрать несколько категорий. Если ничего не выбрано, товар всё равно остаётся в «Все товары»."}</p>
    {error && errorId && <p className={styles.error} id={errorId} role="alert">{error}</p>}
  </div>;
}

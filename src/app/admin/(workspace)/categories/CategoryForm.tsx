"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { saveCategory, type CategoryState } from "./actions";
import { emptyCategoryValues, type CategoryField, type CategoryValues } from "./category-validation";
import styles from "./categories.module.css";

function SaveButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? "Сохраняем…" : "Сохранить категорию"}</button>;
}

export function CategoryForm({ categoryId, values = emptyCategoryValues, published = false }: {
  categoryId: string | null; values?: CategoryValues; published?: boolean;
}) {
  const [state, action] = useActionState(saveCategory.bind(null, categoryId), { values, errors: {} } as CategoryState);
  const field = (name: CategoryField, label: string, options: { multiline?: boolean; maxLength?: number; required?: boolean; readOnly?: boolean; inputMode?: "numeric" } = {}) => (
    <div className={styles.field}>
      <label htmlFor={`category-${name}`}>{label}{options.required ? " *" : ""}</label>
      {options.multiline ? <textarea id={`category-${name}`} name={name} rows={name === "description" ? 5 : 3}
        maxLength={options.maxLength} defaultValue={state.values[name]} key={`${name}-${state.values[name]}`}
        aria-invalid={Boolean(state.errors[name])} aria-describedby={state.errors[name] ? `category-${name}-error` : undefined} />
        : <input id={`category-${name}`} name={name} required={options.required} readOnly={options.readOnly}
          inputMode={options.inputMode} maxLength={options.maxLength} defaultValue={state.values[name]}
          key={`${name}-${state.values[name]}`} aria-invalid={Boolean(state.errors[name])}
          aria-describedby={state.errors[name] ? `category-${name}-error` : undefined} />}
      {state.errors[name] && <p className={styles.error} id={`category-${name}-error`}>{state.errors[name]}</p>}
    </div>
  );
  return <form action={action} className={styles.form} noValidate>
    <h2>{categoryId ? "Редактировать категорию" : "Добавить категорию"}</h2>
    <p className={styles.formNote}>{categoryId ? "Изменения сохраняются для выбранной категории." : "Новая категория сначала будет скрыта от посетителей."}</p>
    {field("name", "Название", { required: true, maxLength: 160 })}
    {field("slug", "Публичный адрес (slug)", { required: true, maxLength: 160, readOnly: published })}
    {published && <p className={styles.hint}>Адрес опубликованной категории закреплён до согласования перенаправления.</p>}
    {field("description", "Описание", { multiline: true, maxLength: 5000 })}
    <div className={styles.formGrid}>
      {field("sort_order", "Порядок показа", { required: true, inputMode: "numeric" })}
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Статус</span>
        <p className={styles.draft}>{categoryId ? published ? "Опубликована — состояние меняется отдельным действием ниже" : "Скрыта — состояние меняется отдельным действием ниже" : "Скрыта — публикация доступна после создания"}</p>
      </div>
    </div>
    {field("seo_title", "SEO-заголовок", { maxLength: 180 })}
    {field("seo_description", "SEO-описание", { multiline: true, maxLength: 320 })}
    {state.errors.form && <p className={styles.formError} role="alert">{state.errors.form}</p>}
    <div className={styles.actions}><SaveButton />{categoryId && <Link href="/admin/categories">Добавить новую</Link>}</div>
  </form>;
}

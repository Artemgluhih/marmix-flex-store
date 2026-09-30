"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createProductAction, type CreateProductState } from "./actions";
import { emptyProductValues, type ProductField } from "./product-validation";
import styles from "./new-product.module.css";

const initialState: CreateProductState = { values: emptyProductValues, errors: {} };
type Category = { id: string; name: string };

function SaveButton({ available }: { available: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={!available || pending} aria-disabled={!available || pending}>
      {pending ? "Сохраняем…" : "Сохранить черновик"}
    </button>
  );
}

export function CreateProductForm({ categories }: { categories: Category[] }) {
  const [state, action] = useActionState(createProductAction, initialState);
  const field = (name: ProductField, label: string, options: {
    required?: boolean; type?: string; placeholder?: string; maxLength?: number; inputMode?: "decimal" | "numeric";
  } = {}) => (
    <div className={styles.field}>
      <label htmlFor={`new-${name}`}>{label}{options.required ? " *" : ""}</label>
      <input
        id={`new-${name}`} name={name} type={options.type ?? "text"} required={options.required}
        placeholder={options.placeholder} maxLength={options.maxLength} inputMode={options.inputMode}
        defaultValue={state.values[name]} key={`${name}-${state.values[name]}`}
        aria-invalid={Boolean(state.errors[name])} aria-describedby={state.errors[name] ? `new-${name}-error` : undefined}
      />
      {state.errors[name] && <p className={styles.error} id={`new-${name}-error`}>{state.errors[name]}</p>}
    </div>
  );
  const select = (name: ProductField, label: string, options: { value: string; label: string }[], required = false) => (
    <div className={styles.field}>
      <label htmlFor={`new-${name}`}>{label}{required ? " *" : ""}</label>
      <select
        id={`new-${name}`} name={name} required={required} defaultValue={state.values[name]}
        key={`${name}-${state.values[name]}`} aria-invalid={Boolean(state.errors[name])}
        aria-describedby={state.errors[name] ? `new-${name}-error` : undefined}
      >
        <option value="">{required ? "Выберите категорию" : "Не задано"}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {state.errors[name] && <p className={styles.error} id={`new-${name}-error`}>{state.errors[name]}</p>}
    </div>
  );

  return (
    <form action={action} className={styles.form} noValidate>
      <section className={styles.section} aria-labelledby="new-product-identity">
        <div className={styles.sectionHeading}>
          <h2 id="new-product-identity">Основное</h2>
          <p>Название, идентификаторы и место товара в каталоге.</p>
        </div>
        <div className={styles.grid}>
          {field("name", "Название", { required: true, maxLength: 160 })}
          {field("sku", "SKU", { required: true, maxLength: 80, placeholder: "MF-ABC-0000" })}
          {field("slug", "Публичный адрес (slug)", { required: true, maxLength: 160, placeholder: "nazvanie-tovara" })}
          {select("category_id", "Категория", categories.map(({ id, name }) => ({ value: id, label: name })), true)}
          {field("series", "Серия", { maxLength: 120 })}
        </div>
        {categories.length === 0 && <p className={styles.notice}>Пока нет категорий. Сохранить товар можно после добавления категории в каталог.</p>}
      </section>

      <section className={styles.section} aria-labelledby="new-product-commerce">
        <div className={styles.sectionHeading}>
          <h2 id="new-product-commerce">Продажа</h2>
          <p>Неизвестные значения оставьте пустыми. Черновик не станет доступным для заказа.</p>
        </div>
        <div className={styles.grid}>
          {field("price", "Точная цена, ₽", { inputMode: "decimal", placeholder: "Например, 1234,50" })}
          {select("price_unit", "Единица цены", [{ value: "м²", label: "м²" }, { value: "шт./упаковка", label: "шт./упаковка" }])}
          {select("sale_unit", "Единица продажи", [{ value: "sheet", label: "лист" }, { value: "шт./упаковка", label: "шт./упаковка" }])}
          {field("min_quantity", "Минимальное количество", { inputMode: "numeric", placeholder: "Целое число" })}
          {field("quantity_step", "Шаг количества", { inputMode: "numeric", placeholder: "Целое число" })}
        </div>
      </section>

      {state.errors.form && <p className={styles.formError} role="alert">{state.errors.form}</p>}
      <div className={styles.actions}>
        <SaveButton available={categories.length > 0} />
        <Link href="/admin/products">Вернуться к товарам</Link>
      </div>
    </form>
  );
}

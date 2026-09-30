"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { saveProductProperties, type EditState } from "./actions";
import { MAX_SPECS, type EditField, type EditValues } from "./edit-validation";
import base from "../new/new-product.module.css";
import styles from "./edit-product.module.css";

function SaveButton({ previewOnly }: { previewOnly: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending || previewOnly}>{pending ? "Сохраняем…" : "Сохранить изменения"}</button>;
}

export function EditProductForm({ productId, values, areaAllowed = false, previewOnly = false, previewErrors = false }: {
  productId: string; values: EditValues; areaAllowed?: boolean; previewOnly?: boolean; previewErrors?: boolean;
}) {
  const [state, action] = useActionState(saveProductProperties.bind(null, productId), { values, errors: previewErrors ? {
    width_mm: "Укажите положительное целое число миллиметров.",
    specs: "Заполните пары «Название — Значение» без HTML и повторов.",
    seo_title: "SEO-заголовок: до 180 символов, без HTML.",
  } : {} } as EditState);
  const [specRows, setSpecRows] = useState(Math.max(1, state.values.specs.findLastIndex(({ key, value }) => key || value) + 1));
  const field = (name: EditField, label: string, options: { multiline?: boolean; inputMode?: "numeric" | "decimal"; maxLength?: number; disabled?: boolean } = {}) => (
    <div className={base.field}>
      <label htmlFor={`edit-${name}`}>{label}</label>
      {options.multiline ? (
        <textarea id={`edit-${name}`} name={name} rows={6} maxLength={options.maxLength}
          defaultValue={state.values[name]} key={`${name}-${state.values[name]}`}
          aria-invalid={Boolean(state.errors[name])} aria-describedby={state.errors[name] ? `edit-${name}-error` : undefined}
          className={styles.textarea} />
      ) : (
        <input id={`edit-${name}`} name={name} inputMode={options.inputMode} maxLength={options.maxLength}
          disabled={options.disabled} defaultValue={state.values[name]} key={`${name}-${state.values[name]}`}
          aria-invalid={Boolean(state.errors[name])} aria-describedby={state.errors[name] ? `edit-${name}-error` : undefined} />
      )}
      {state.errors[name] && <p className={base.error} id={`edit-${name}-error`}>{state.errors[name]}</p>}
    </div>
  );

  return (
    <form action={action} className={base.form} noValidate>
      <section className={base.section} aria-labelledby="edit-dimensions">
        <div className={base.sectionHeading}>
          <h2 id="edit-dimensions">Материал и размеры</h2>
          <p>Заполняйте только подтверждённые параметры. Пустое поле останется неопределённым.</p>
        </div>
        <div className={base.grid}>
          {field("width_mm", "Ширина, мм", { inputMode: "numeric" })}
          {field("height_mm", "Высота, мм", { inputMode: "numeric" })}
          {field("thickness_mm", "Толщина, мм", { inputMode: "numeric" })}
          {field("area_per_sale_unit_m2", "Площадь продаваемого листа, м²", { inputMode: "decimal", disabled: !areaAllowed })}
        </div>
        {!areaAllowed && <p className={base.notice}>Площадь доступна только для товара с продажей листами и ценой за м².</p>}
      </section>
      <section className={base.section} aria-labelledby="edit-content">
        <div className={base.sectionHeading}>
          <h2 id="edit-content">Описание и характеристики</h2>
          <p>Дополнительные характеристики сохраняются как простые пары «Название — Значение».</p>
        </div>
        {field("description", "Описание", { multiline: true, maxLength: 5000 })}
        <div className={styles.specs}>
          <h3>Характеристики</h3>
          {Array.from({ length: specRows }, (_, index) => (
            <div className={styles.specRow} key={index}>
              <div className={base.field}>
                <label htmlFor={`spec-key-${index}`}>Название {index + 1}</label>
                <input id={`spec-key-${index}`} name={`spec_key_${index}`} maxLength={64}
                  defaultValue={state.values.specs[index]?.key ?? ""} key={`key-${index}-${state.values.specs[index]?.key ?? ""}`}
                  aria-invalid={Boolean(state.errors.specs)} aria-describedby={state.errors.specs ? "edit-specs-error" : undefined} />
              </div>
              <div className={base.field}>
                <label htmlFor={`spec-value-${index}`}>Значение {index + 1}</label>
                <input id={`spec-value-${index}`} name={`spec_value_${index}`} maxLength={240}
                  defaultValue={state.values.specs[index]?.value ?? ""} key={`value-${index}-${state.values.specs[index]?.value ?? ""}`}
                  aria-invalid={Boolean(state.errors.specs)} aria-describedby={state.errors.specs ? "edit-specs-error" : undefined} />
              </div>
            </div>
          ))}
          {state.errors.specs && <p className={base.error} id="edit-specs-error">{state.errors.specs}</p>}
          {specRows < MAX_SPECS && <button className={styles.addSpec} type="button" onClick={() => setSpecRows((count) => Math.min(MAX_SPECS, count + 1))}>Добавить характеристику</button>}
        </div>
      </section>
      <section className={base.section} aria-labelledby="edit-seo">
        <div className={base.sectionHeading}>
          <h2 id="edit-seo">SEO</h2>
          <p>Необязательные заголовок и описание страницы товара.</p>
        </div>
        <div className={styles.seoGrid}>
          {field("seo_title", "SEO-заголовок", { maxLength: 180 })}
          {field("seo_description", "SEO-описание", { multiline: true, maxLength: 320 })}
        </div>
      </section>
      {state.errors.form && <p className={base.formError} role="alert">{state.errors.form}</p>}
      <div className={base.actions}>
        <SaveButton previewOnly={previewOnly} />
        <Link href="/admin/products">Вернуться к товарам</Link>
      </div>
    </form>
  );
}

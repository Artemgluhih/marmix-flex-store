"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveProductCategories, type MembershipState } from "./category-actions";
import styles from "../new/new-product.module.css";

function SaveButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? "Сохраняем…" : "Сохранить категории"}</button>;
}

export function ProductCategoriesForm({ productId, categories, selectedIds }: {
  productId: string; categories: { id: string; name: string }[]; selectedIds: string[];
}) {
  const [state, action] = useActionState(saveProductCategories.bind(null, productId),
    { selectedIds, error: "", saved: false } as MembershipState);
  return <form action={action} className={styles.form}>
    <section className={styles.section} aria-labelledby="edit-categories">
      <div className={styles.sectionHeading}>
        <h2 id="edit-categories">Категории</h2>
        <p>Один товар может находиться в нескольких категориях. Без выбора он остаётся в «Все товары».</p>
      </div>
      <fieldset className={styles.categories} aria-describedby={state.error ? "edit-categories-error" : undefined}>
        <legend>Пользовательские категории</legend>
        {categories.length === 0 ? <p>Пользовательские категории пока не добавлены.</p> : categories.map(({ id, name }) =>
          <label key={id}><input name="category_ids" type="checkbox" value={id} defaultChecked={state.selectedIds.includes(id)} />{name}</label>)}
      </fieldset>
      {state.error && <p className={styles.formError} id="edit-categories-error" role="alert">{state.error}</p>}
      {state.saved && <p role="status">Категории сохранены.</p>}
      <div className={styles.actions}><SaveButton /></div>
    </section>
  </form>;
}

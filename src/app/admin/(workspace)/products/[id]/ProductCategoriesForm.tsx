"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CategoryMultiselect } from "@/components/admin/CategoryMultiselect";
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
      <CategoryMultiselect key={state.selectedIds.join(",")} categories={categories}
        selectedIds={state.selectedIds} error={state.error} errorId="edit-categories-error" />
      {state.saved && <p role="status">Категории сохранены.</p>}
      <div className={styles.actions}><SaveButton /></div>
    </section>
  </form>;
}

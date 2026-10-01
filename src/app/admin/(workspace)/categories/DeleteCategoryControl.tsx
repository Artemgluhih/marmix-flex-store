"use client";

import { useFormStatus } from "react-dom";
import { deleteCategory } from "./delete-action";
import styles from "./categories.module.css";

function DeleteButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? "Удаляем…" : "Подтвердить удаление категории"}</button>;
}

export function DeleteCategoryControl({ id, name, linkedCount, published }: {
  id: string; name: string; linkedCount: number; published: boolean;
}) {
  return <section className={styles.publication} aria-label="Удаление пользовательской категории">
    <h2>Удаление категории</h2>
    {published ? <p>Сначала снимите опубликованную категорию с публикации. Адрес категории исчезнет без перенаправления.</p>
      : <details className={styles.confirmation}>
        <summary>Удалить категорию</summary>
        <div className={styles.confirmationBody}>
          <p><strong>{name}</strong> — связанных товаров: <strong>{linkedCount}</strong>.</p>
          <p>Будет удалена только категория и её связи. Сами товары останутся в «Все товары» и других категориях.</p>
          <form action={deleteCategory.bind(null, id)}><DeleteButton /></form>
        </div>
      </details>}
  </section>;
}

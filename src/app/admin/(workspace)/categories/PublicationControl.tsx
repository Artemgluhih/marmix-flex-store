"use client";

import { useFormStatus } from "react-dom";

import { publishCategory, unpublishCategory } from "./publication-actions";
import styles from "./categories.module.css";

function ConfirmButton({ published }: { published: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>
    {pending ? "Сохраняем…" : published ? "Подтвердить скрытие" : "Подтвердить публикацию"}
  </button>;
}

export function PublicationControl({ id, name, published, affectedCount }: {
  id: string; name: string; published: boolean; affectedCount: number;
}) {
  const action = published ? unpublishCategory.bind(null, id) : publishCategory.bind(null, id);
  return <section className={styles.publication} aria-labelledby="category-publication-title">
    <h2 id="category-publication-title">Публикация категории</h2>
    <p>Текущее состояние: <strong>{published ? "Опубликована" : "Скрыта"}</strong></p>
    <p>Опубликованных и неархивных товаров в категории: <strong>{affectedCount}</strong>.</p>
    <details className={styles.confirmation}>
      <summary>{published ? "Снять с публикации" : "Опубликовать"}</summary>
      <div className={styles.confirmationBody}>
        <p><strong>{name}</strong></p>
        {published ? <p>Скрыть категорию? Её страница и список исчезнут из публичного каталога. {affectedCount} опубликованных неархивных товаров перестанут показываться в этой категории, но останутся в «Все товары», Product Detail и других опубликованных категориях. Их статус, связи и данные сохраняются.</p>
          : <p>Опубликовать категорию? {affectedCount} опубликованных неархивных товаров снова появятся в её списке. Скрытые и архивные товары останутся скрытыми. Глобальная видимость и данные товаров не меняются.</p>}
        <form action={action}><ConfirmButton published={published} /></form>
      </div>
    </details>
  </section>;
}

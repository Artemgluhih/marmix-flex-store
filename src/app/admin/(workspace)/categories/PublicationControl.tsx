"use client";

import { useFormStatus } from "react-dom";

import { publishCategory, unpublishCategory } from "./publication-actions";
import styles from "./categories.module.css";

function ConfirmButton({ published, previewOnly }: { published: boolean; previewOnly: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending || previewOnly}>
    {pending ? "Сохраняем…" : published ? "Подтвердить скрытие" : "Подтвердить публикацию"}
  </button>;
}

export function PublicationControl({ id, name, published, affectedCount, previewOnly = false }: {
  id: string; name: string; published: boolean; affectedCount: number; previewOnly?: boolean;
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
        {published ? <p>Скрыть категорию? Она исчезнет из публичного каталога, а {affectedCount} опубликованных неархивных товаров перестанут быть публично видимыми. Товары не архивируются и не удаляются; их собственный статус публикации и данные сохраняются.</p>
          : <p>Опубликовать категорию? До {affectedCount} ранее опубликованных неархивных товаров могут снова стать публично видимыми. Скрытые и архивные товары останутся скрытыми. Данные товаров не меняются.</p>}
        <form action={action}><ConfirmButton published={published} previewOnly={previewOnly} /></form>
      </div>
    </details>
    {previewOnly && <p className={styles.hint}>Визуальный образец: сохранение отключено.</p>}
  </section>;
}

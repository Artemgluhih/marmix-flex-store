"use client";

import styles from "../admin-states.module.css";

export default function AdminProductsError({ reset }: { reset: () => void }) {
  return (
    <div className={styles.state} role="alert">
      <span className={styles.eyebrow}>Рабочее пространство / Каталог</span>
      <h1>Не удалось загрузить товары</h1>
      <p>Список сейчас недоступен. Попробуйте обновить данные.</p>
      <button type="button" className={styles.retry} onClick={() => reset()}>
        Повторить попытку
      </button>
    </div>
  );
}

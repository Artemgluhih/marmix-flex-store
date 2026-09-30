"use client";

import styles from "./admin-states.module.css";

export default function AdminOverviewError({ reset }: { reset: () => void }) {
  return (
    <div className={styles.state} role="alert">
      <span className={styles.eyebrow}>Рабочее пространство / Обзор</span>
      <h1>Не удалось загрузить обзор</h1>
      <p>Показатели сейчас недоступны. Попробуйте обновить данные.</p>
      <button type="button" className={styles.retry} onClick={() => reset()}>
        Повторить попытку
      </button>
    </div>
  );
}

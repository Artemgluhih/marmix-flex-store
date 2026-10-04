"use client";

import styles from "./orders.module.css";

export default function AdminOrdersError({ reset }: { reset: () => void }) {
  return <section className={styles.empty} role="alert">
    <h2>Не удалось загрузить заявки</h2>
    <p>Попробуйте загрузить список ещё раз.</p>
    <button type="button" className={styles.retry} onClick={reset}>Повторить загрузку заявок</button>
  </section>;
}

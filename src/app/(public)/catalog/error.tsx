"use client";

import styles from "./catalog.module.css";

export default function CatalogError({ reset }: { reset: () => void }) {
  return (
    <section className={styles.catalog} aria-labelledby="catalog-error-title">
      <header className={styles.head}>
        <h1 id="catalog-error-title">Не удалось загрузить каталог</h1>
        <p className={styles.description}>Повторите попытку.</p>
      </header>
      <button className={styles.retry} type="button" onClick={reset}>Повторить загрузку каталога</button>
    </section>
  );
}

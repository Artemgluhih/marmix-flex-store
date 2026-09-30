import styles from "../admin-states.module.css";

export default function AdminProductsLoading() {
  return (
    <div className={styles.state} role="status" aria-live="polite">
      <span className={styles.eyebrow}>Рабочее пространство / Каталог</span>
      <h1>Загружаем товары</h1>
      <p>Проверяем доступ и получаем список каталога.</p>
    </div>
  );
}

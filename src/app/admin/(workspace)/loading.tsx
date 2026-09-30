import styles from "./admin-states.module.css";

export default function AdminOverviewLoading() {
  return (
    <div className={styles.state} role="status" aria-live="polite">
      <span className={styles.eyebrow}>Рабочее пространство / Обзор</span>
      <h1>Загружаем обзор</h1>
      <p>Проверяем доступ и получаем текущие показатели.</p>
    </div>
  );
}

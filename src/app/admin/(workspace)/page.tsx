import type { Metadata } from "next";
import styles from "./admin-shell.module.css";

export const metadata: Metadata = {
  title: "Панель управления — Marmix Flex",
  robots: { index: false, follow: false },
};

export default function AdminHomePage() {
  return (
    <div className={styles.landing}>
      <div className={styles.pageHeading}>
        <p className={styles.eyebrow}>Рабочее пространство / Обзор</p>
        <h1>Панель управления</h1>
        <p>Здесь будут доступны управление каталогом и работа с заявками.</p>
      </div>
      <div className={styles.introPanel}>
        <span className={styles.introRule} aria-hidden="true" />
        <p>Разделы панели появятся по мере завершения следующих этапов разработки.</p>
      </div>
    </div>
  );
}

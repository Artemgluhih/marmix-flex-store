import type { Metadata } from "next";

import { requireAdmin } from "@/lib/admin/require-admin";
import { getDashboardCounts } from "./dashboard-counts";
import styles from "./dashboard.module.css";

export const metadata: Metadata = {
  title: "Обзор — Marmix Flex",
  robots: { index: false, follow: false },
};

export default async function AdminHomePage() {
  // The layout guard protects the shell; the data read repeats authorization itself.
  const { supabase } = await requireAdmin();
  const counts = await getDashboardCounts(supabase);

  return (
    <div className={styles.dashboard}>
      <div className={styles.heading}>
        <p className={styles.eyebrow}>Рабочее пространство / Обзор</p>
        <h1>Панель управления</h1>
        <p>Текущее состояние заявок и каталога.</p>
      </div>
      <div className={styles.groups}>
        <section className={styles.group} aria-labelledby="orders-title">
          <div className={styles.groupHeading}>
            <div>
              <span className={styles.groupIndex}>01 / Заявки</span>
              <h2 id="orders-title">Заявки</h2>
            </div>
            <span className={styles.destination}>Раздел заявок — скоро</span>
          </div>
          <dl className={styles.metrics}>
            <div className={styles.metric}>
              <dt>Новые</dt>
              <dd>{counts.newOrders}</dd>
            </div>
            <div className={styles.metric}>
              <dt>В работе</dt>
              <dd>{counts.inProgressOrders}</dd>
            </div>
          </dl>
          {counts.newOrders === 0 && counts.inProgressOrders === 0 && (
            <p className={styles.emptyNote}>Пока нет новых заявок и заявок в работе.</p>
          )}
        </section>
        <section className={styles.group} aria-labelledby="products-title">
          <div className={styles.groupHeading}>
            <div>
              <span className={styles.groupIndex}>02 / Каталог</span>
              <h2 id="products-title">Каталог</h2>
            </div>
            <span className={styles.destination}>Раздел товаров — скоро</span>
          </div>
          <dl className={styles.metrics}>
            <div className={styles.metric}>
              <dt>Опубликованы</dt>
              <dd>{counts.publishedProducts}</dd>
            </div>
            <div className={styles.metric}>
              <dt>Скрыты</dt>
              <dd>{counts.hiddenProducts}</dd>
            </div>
            <div className={`${styles.metric} ${styles.archived}`}>
              <dt>В архиве</dt>
              <dd>{counts.archivedProducts}</dd>
            </div>
          </dl>
          {counts.publishedProducts === 0 && counts.hiddenProducts === 0 && counts.archivedProducts === 0 && (
            <p className={styles.emptyNote}>В каталоге пока нет товаров.</p>
          )}
        </section>
      </div>
    </div>
  );
}

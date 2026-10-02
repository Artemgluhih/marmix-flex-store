import Link from "next/link";
import styles from "./catalog.module.css";
import grid from "@/components/catalog/ProductGrid.module.css";

export default function CatalogLoading() {
  return (
    <section className={styles.catalog} aria-labelledby="catalog-loading-title" aria-busy="true">
      <nav className={styles.breadcrumb} aria-label="Навигационная цепочка">
        <Link href="/">Главная</Link><span aria-hidden="true">/</span><span aria-current="page">Каталог</span>
      </nav>
      <header className={styles.head}>
        <p className={styles.eyebrow}>Все товары</p>
        <h1 id="catalog-loading-title">Каталог</h1>
      </header>
      <p className={styles.loadingAnnouncement} role="status">Загрузка каталога…</p>
      <div className={styles.loadingControls} aria-hidden="true"><span /><span /><span /></div>
      <div className={grid.grid} aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => (
          <div className={grid.card} key={index}>
            <div className={grid.imageFrame} />
            <div className={grid.info}><span className={styles.loadingName} /><span className={styles.loadingPrice} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}

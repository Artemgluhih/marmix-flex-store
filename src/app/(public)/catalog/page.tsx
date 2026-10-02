import Link from "next/link";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { listPublishedProducts } from "@/lib/catalog/queries";
import styles from "./catalog.module.css";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const { products, total } = await listPublishedProducts();

  return (
    <section className={styles.catalog} aria-labelledby="catalog-title">
      <nav className={styles.breadcrumb} aria-label="Навигационная цепочка">
        <Link href="/">Главная</Link><span aria-hidden="true">/</span><span aria-current="page">Каталог</span>
      </nav>
      <header className={styles.head}>
        <p className={styles.eyebrow}>Все товары</p>
        <h1 id="catalog-title">Каталог</h1>
        <p className={styles.count}>Материалов: {total}</p>
      </header>
      <ProductGrid products={products} />
    </section>
  );
}

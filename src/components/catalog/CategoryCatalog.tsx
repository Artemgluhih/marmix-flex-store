import Link from "next/link";
import type { PublicCategory, PublicProduct } from "@/lib/catalog/types";
import { ProductGrid } from "./ProductGrid";
import styles from "@/app/(public)/catalog/catalog.module.css";

export function CategoryCatalog({ category, products, total }: {
  category: PublicCategory;
  products: PublicProduct[];
  total: number;
}) {
  return (
    <section className={styles.catalog} aria-labelledby="category-title">
      <nav className={styles.breadcrumb} aria-label="Навигационная цепочка">
        <Link href="/">Главная</Link><span aria-hidden="true">/</span>
        <Link href="/catalog">Каталог</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{category.name}</span>
      </nav>
      <header className={styles.head}>
        <p className={styles.eyebrow}>Каталог</p>
        <h1 id="category-title">{category.name}</h1>
        <p className={styles.count}>Материалов: {total}</p>
      </header>
      <ProductGrid products={products} />
    </section>
  );
}

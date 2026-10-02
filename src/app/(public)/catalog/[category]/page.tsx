import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { listPublishedProducts } from "@/lib/catalog/queries";
import styles from "../catalog.module.css";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const { products, total, category } = await listPublishedProducts({ categorySlug: slug });
  if (!category) notFound();

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

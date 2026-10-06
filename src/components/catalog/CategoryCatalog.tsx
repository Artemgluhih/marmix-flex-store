import Link from "next/link";
import type { CatalogFacets, PublicCategory, PublicProduct } from "@/lib/catalog/types";
import type { CatalogListParams } from "@/lib/catalog/query-params";
import { ProductGrid } from "./ProductGrid";
import { CatalogControls } from "./CatalogControls";
import { CatalogPagination } from "./CatalogPagination";
import styles from "@/app/(public)/catalog/catalog.module.css";

export function CategoryCatalog({ category, result, facets, params, unfilteredTotal }: {
  category: PublicCategory;
  result: { products: PublicProduct[]; total: number; pageSize: number };
  facets: CatalogFacets;
  params: CatalogListParams;
  unfilteredTotal: number;
}) {
  const { products, total, pageSize } = result;
  const emptyMessage = total > 0 && (params.page - 1) * pageSize >= total
    ? "На этой странице материалов нет."
    : unfilteredTotal === 0 ? "В этой категории сейчас нет опубликованных материалов."
      : "По этим параметрам материалы не найдены.";
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
      </header>
      <CatalogControls params={params} facets={facets} total={total} />
      <ProductGrid products={products} linkToDetail emptyKind="results" emptyMessage={emptyMessage} />
      <CatalogPagination params={params} total={total} pageSize={pageSize} />
    </section>
  );
}

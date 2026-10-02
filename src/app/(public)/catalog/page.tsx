import Link from "next/link";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { CatalogControls } from "@/components/catalog/CatalogControls";
import { CatalogPagination } from "@/components/catalog/CatalogPagination";
import { getCatalogFacets, listPublishedProducts } from "@/lib/catalog/queries";
import { normalizeCatalogListParams } from "@/lib/catalog/query-params";
import { hasActiveCatalogParams } from "@/lib/catalog/url-state";
import styles from "./catalog.module.css";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CatalogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams;
  const input = {
    q: raw.q, price_min: raw.price_min, price_max: raw.price_max,
    status: raw.status, sort: raw.sort, page: raw.page, categorySlug: raw.category,
  };
  const params = normalizeCatalogListParams(input);
  const [facets, result] = await Promise.all([getCatalogFacets(), listPublishedProducts(input)]);
  const { products, total, pageSize } = result;
  const visibleCatalogCount = total === 0 ? (await listPublishedProducts()).total : total;
  const trulyEmpty = visibleCatalogCount === 0;
  const emptyMessage = total > 0 && (params.page - 1) * pageSize >= total
    ? "На этой странице материалов нет."
    : hasActiveCatalogParams(params) || params.page > 1 ? "По этим параметрам материалы не найдены." : undefined;

  return (
    <section className={styles.catalog} aria-labelledby="catalog-title">
      <nav className={styles.breadcrumb} aria-label="Навигационная цепочка">
        <Link href="/">Главная</Link><span aria-hidden="true">/</span><span aria-current="page">Каталог</span>
      </nav>
      <header className={styles.head}>
        <p className={styles.eyebrow}>Все товары</p>
        <h1 id="catalog-title">Каталог</h1>
      </header>
      <CatalogControls params={params} facets={facets} total={total} />
      <ProductGrid products={products} emptyMessage={trulyEmpty ? undefined : emptyMessage} emptyKind={trulyEmpty ? "catalog" : "results"} />
      <CatalogPagination params={params} total={total} pageSize={pageSize} />
    </section>
  );
}

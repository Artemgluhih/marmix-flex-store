import Link from "next/link";
import type { CatalogListParams } from "@/lib/catalog/query-params";
import { catalogHref } from "@/lib/catalog/url-state";
import styles from "./CatalogPagination.module.css";

export function CatalogPagination({ params, total, pageSize }: {
  params: CatalogListParams; total: number; pageSize: number;
}) {
  const pages = Math.ceil(total / pageSize);
  if (params.page > pages && params.page > 1) {
    return <nav className={styles.pagination} aria-label="Страницы каталога"><Link href={catalogHref(params)}>К первой странице</Link></nav>;
  }
  if (pages <= 1) return null;
  const start = Math.max(1, params.page - 2);
  const end = Math.min(pages, params.page + 2);
  return (
    <nav className={styles.pagination} aria-label="Страницы каталога">
      {params.page > 1 && <Link href={catalogHref(params, params.page - 1)}>Назад</Link>}
      {Array.from({ length: end - start + 1 }, (_, index) => start + index).map((page) => (
        <Link key={page} href={catalogHref(params, page)} aria-current={page === params.page ? "page" : undefined}>{page}</Link>
      ))}
      {params.page < pages && <Link href={catalogHref(params, params.page + 1)}>Далее</Link>}
    </nav>
  );
}

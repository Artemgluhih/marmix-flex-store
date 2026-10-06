import Link from "next/link";
import type { PublicCategory } from "@/lib/catalog/types";
import type { CatalogListParams } from "@/lib/catalog/query-params";
import { catalogHref } from "@/lib/catalog/url-state";
import styles from "./CatalogControls.module.css";

export function CategoryNavigation({ categories, params }: { categories: PublicCategory[]; params: CatalogListParams }) {
  return <nav className={styles.categories} aria-label="Категории материалов">
    <Link scroll={false} href={catalogHref({ ...params, categorySlug: null })} aria-current={!params.categorySlug ? "page" : undefined}>Все материалы</Link>
    {categories.map((category) => <Link scroll={false} key={category.id} href={catalogHref({ ...params, categorySlug: category.slug })}
      aria-current={params.categorySlug === category.slug ? "page" : undefined}>{category.name}</Link>)}
  </nav>;
}

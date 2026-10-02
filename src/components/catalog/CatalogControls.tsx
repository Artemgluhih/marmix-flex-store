import Link from "next/link";
import type { CatalogFacets } from "@/lib/catalog/types";
import type { CatalogListParams } from "@/lib/catalog/query-params";
import { hasActiveCatalogParams, priceInput } from "@/lib/catalog/url-state";
import styles from "./CatalogControls.module.css";

const statusLabels: Record<NonNullable<CatalogListParams["status"]>, string> = {
  in_stock: "В наличии",
  on_order: "Под заказ",
};

export function CatalogControls({ params, facets, total }: {
  params: CatalogListParams; facets: CatalogFacets; total: number;
}) {
  const statuses = facets.availabilityStatuses.filter((value): value is keyof typeof statusLabels => value in statusLabels);
  const categoryName = facets.categories.find((item) => item.slug === params.categorySlug)?.name;
  const active = hasActiveCatalogParams(params) || params.page > 1;

  return (
    <div className={styles.controls}>
      <form className={styles.form} method="get" action="/catalog" role="search">
        <div className={styles.searchRow}>
          <label className={styles.field}>
            <span>Поиск по названию или артикулу</span>
            <input type="search" name="q" defaultValue={params.q ?? ""} maxLength={80} placeholder="Название или SKU" />
          </label>
          <button className={styles.submit} type="submit">Показать</button>
        </div>
        <div className={styles.filterRow}>
          {facets.categories.length > 0 && (
            <label className={styles.field}>
              <span>Категория</span>
              <select name="category" defaultValue={categoryName ? params.categorySlug ?? "" : ""}>
                <option value="">Все товары</option>
                {facets.categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
              </select>
            </label>
          )}
          {facets.fixedPriceMinor && (
            <>
              <label className={styles.field}>
                <span>Цена от, ₽</span>
                <input name="price_min" inputMode="decimal" type="text" defaultValue={priceInput(params.priceMinMinor)} placeholder={priceInput(facets.fixedPriceMinor.min)} />
              </label>
              <label className={styles.field}>
                <span>Цена до, ₽</span>
                <input name="price_max" inputMode="decimal" type="text" defaultValue={priceInput(params.priceMaxMinor)} placeholder={priceInput(facets.fixedPriceMinor.max)} />
              </label>
            </>
          )}
          {statuses.length > 0 && (
            <label className={styles.field}>
              <span>Наличие</span>
              <select name="status" defaultValue={params.status && statuses.includes(params.status) ? params.status : ""}>
                <option value="">Любое</option>
                {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
              </select>
            </label>
          )}
          <label className={styles.field}>
            <span>Сортировка</span>
            <select name="sort" defaultValue={params.sort}>
              <option value="order">По умолчанию</option>
              <option value="price_asc">Цена: по возрастанию</option>
              <option value="price_desc">Цена: по убыванию</option>
            </select>
          </label>
        </div>
      </form>
      <div className={styles.summary}>
        <p>Материалов: {total}</p>
        {active && <Link href="/catalog">Сбросить</Link>}
      </div>
      {active && (
        <div className={styles.active} aria-label="Активные параметры">
          {params.q && <span>Поиск: {params.q}</span>}
          {params.categorySlug && <span>Категория: {categoryName ?? "недоступна"}</span>}
          {params.priceMinMinor !== null && <span>От {priceInput(params.priceMinMinor)} ₽</span>}
          {params.priceMaxMinor !== null && <span>До {priceInput(params.priceMaxMinor)} ₽</span>}
          {params.status && <span>Наличие: {statuses.includes(params.status) ? statusLabels[params.status] : "недоступно"}</span>}
          {params.sort !== "order" && <span>{params.sort === "price_asc" ? "Цена ↑" : "Цена ↓"}</span>}
          {params.page > 1 && <span>Страница {params.page}</span>}
        </div>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/admin/require-admin";
import {
  getRealCategoryOptions, getRealProductsPage, parseProductListParams, productsHref,
  PAGE_SIZE, type RawProductListParams,
} from "./products-list";
import { productPrice, productStatus } from "./product-presentation";
import styles from "./products.module.css";

export const metadata: Metadata = {
  title: "Товары — Marmix Flex",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<RawProductListParams>;
}) {
  const { supabase } = await requireAdmin("/admin/products");
  const categories = await getRealCategoryOptions(supabase);
  const params = parseProductListParams(await searchParams, categories);
  const { products, total, page, catalogEmpty } = await getRealProductsPage(supabase, params);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const first = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, total);

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <p className={styles.eyebrow}>Рабочее пространство / Каталог</p>
        <h1>Товары</h1>
        <p>Список товаров основного каталога и их текущий статус.</p>
        <Link className={styles.createLink} href="/admin/products/new">Добавить товар</Link>
      </div>
      <form className={styles.filters} action="/admin/products" method="get" role="search">
        <div className={styles.searchControl}>
          <label htmlFor="products-q">Поиск по SKU или названию</label>
          <input id="products-q" name="q" type="search" maxLength={80} defaultValue={params.q} placeholder="Название или SKU" />
        </div>
        <div className={styles.filterControl}>
          <label htmlFor="products-status">Статус</label>
          <select id="products-status" name="status" defaultValue={params.status}>
            <option value="">Все статусы</option>
            <option value="published">Опубликованы</option>
            <option value="unpublished">Скрыты</option>
            <option value="archived">В архиве</option>
          </select>
        </div>
        <div className={styles.filterControl}>
          <label htmlFor="products-category">Категория</label>
          <select id="products-category" name="category" defaultValue={params.category}>
            <option value="">Все категории</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </div>
        <div className={styles.filterControl}>
          <label htmlFor="products-sort">Порядок</label>
          <select id="products-sort" name="sort" defaultValue={params.sort}>
            <option value="order">Порядок каталога</option>
            <option value="name_asc">Название А–Я</option>
            <option value="name_desc">Название Я–А</option>
            <option value="sku">SKU</option>
            <option value="newest">Сначала новые</option>
          </select>
        </div>
        <div className={styles.filterActions}>
          <button type="submit">Применить</button>
          <Link href="/admin/products">Сбросить</Link>
        </div>
      </form>
      <p className={styles.resultCount} aria-live="polite">
        {total === 0 ? "Найдено: 0" : `Показаны ${first}–${last} из ${total}`}
      </p>
      {products.length === 0 ? (
        <section className={styles.empty} aria-labelledby="empty-products">
          <h2 id="empty-products">{catalogEmpty ? "Товары пока не добавлены" : "По заданным параметрам товары не найдены"}</h2>
          <p>{catalogEmpty ? "Когда товары появятся в каталоге, они будут видны здесь." : "Измените поисковый запрос или сбросьте фильтры."}</p>
        </section>
      ) : (
        <div className={styles.tableFrame}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">SKU</th>
                <th scope="col">Название</th>
                <th scope="col">Категория</th>
                <th scope="col">Цена</th>
                <th scope="col">Статус</th>
                <th scope="col">Действие</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const status = productStatus(product);
                return (
                  <tr key={product.id}>
                    <td className={styles.sku}><span className={styles.mobileLabel} aria-hidden="true">SKU</span>{product.sku}</td>
                    <td className={styles.name}><span className={styles.mobileLabel} aria-hidden="true">Название</span>{product.name}</td>
                    <td><span className={styles.mobileLabel} aria-hidden="true">Категория</span>{product.categories?.name ?? "Без категории"}</td>
                    <td className={styles.price}><span className={styles.mobileLabel} aria-hidden="true">Цена</span>{productPrice(product)}</td>
                    <td><span className={styles.mobileLabel} aria-hidden="true">Статус</span><span className={`${styles.badge} ${status === "Опубликован" ? styles.published : status === "В архиве" ? styles.archived : styles.hidden}`}>{status}</span></td>
                    <td><span className={styles.mobileLabel} aria-hidden="true">Действие</span><Link className={styles.editLink} href={`/admin/products/${product.id}`}>Редактировать</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {total > PAGE_SIZE && (
        <nav className={styles.pagination} aria-label="Страницы списка товаров">
          {page > 1 ? <Link href={productsHref(params, page - 1)} rel="prev">← Предыдущая</Link> : <span aria-disabled="true">← Предыдущая</span>}
          <span>Страница {page} из {pages}</span>
          {page < pages ? <Link href={productsHref(params, page + 1)} rel="next">Следующая →</Link> : <span aria-disabled="true">Следующая →</span>}
        </nav>
      )}
    </div>
  );
}

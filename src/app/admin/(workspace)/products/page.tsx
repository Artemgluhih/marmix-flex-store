import type { Metadata } from "next";

import { requireAdmin } from "@/lib/admin/require-admin";
import { getRealProducts } from "./products-list";
import { productPrice, productStatus } from "./product-presentation";
import styles from "./products.module.css";

export const metadata: Metadata = {
  title: "Товары — Marmix Flex",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  const { supabase } = await requireAdmin("/admin/products");
  const products = await getRealProducts(supabase);

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <p className={styles.eyebrow}>Рабочее пространство / Каталог</p>
        <h1>Товары</h1>
        <p>Список товаров основного каталога и их текущий статус.</p>
      </div>
      {products.length === 0 ? (
        <section className={styles.empty} aria-labelledby="empty-products">
          <h2 id="empty-products">Товары пока не добавлены</h2>
          <p>Когда товары появятся в каталоге, они будут видны здесь.</p>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

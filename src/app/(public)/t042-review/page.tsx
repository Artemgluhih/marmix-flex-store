import Link from "next/link";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import type { PublicProduct } from "@/lib/catalog/types";
import CatalogLoading from "../catalog/loading";
import styles from "../catalog/catalog.module.css";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

const longProduct: PublicProduct = {
  id: "render-only", sku: "RENDER-ONLY", slug: "render-only",
  name: "Очень длинное название материала для проверки переноса в карточке на узком экране и при большой ширине каталога",
  series: null, priceMinor: null, currency: "RUB", priceUnit: null,
  saleUnit: null, minQuantity: null, quantityStep: null,
  areaPerSaleUnitM2: null, sourcePriceRange: null, availabilityStatus: null,
  isFeatured: false, sortOrder: 0, categories: [], primaryImage: null,
};
const longUnit: PublicProduct = { ...longProduct, id: "render-only-unit", name: "Проверка длинной единицы цены", priceMinor: 160000, priceUnit: "очень длинная единица измерения для проверки переноса" };

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state } = await searchParams;
  return (
    <section className={styles.catalog} aria-labelledby="review-title">
      <nav className={styles.breadcrumb} aria-label="Навигационная цепочка"><Link href="/catalog">Каталог</Link><span aria-hidden="true">/</span><span aria-current="page">T042 render-only review</span></nav>
      <header className={styles.head}><p className={styles.eyebrow}>Только Preview · без данных Supabase</p><h1 id="review-title">T042 состояния каталога</h1></header>
      <nav className={styles.breadcrumb} aria-label="Состояния каталога">
        {[
          ["no-results", "Нет результатов"], ["empty", "Пустой каталог"],
          ["error", "Ошибка"], ["long", "Длинное имя и NULL"], ["loading", "Загрузка"],
        ].map(([key, label]) => <Link key={key} href={`/t042-review?state=${key}`}>{label}</Link>)}
      </nav>
      <div style={{ marginTop: 44 }}>
        {state === "empty" ? <ProductGrid products={[]} emptyKind="catalog" />
          : state === "error" ? <div role="alert"><h2>Не удалось загрузить каталог</h2><p>Повторите попытку.</p><Link className={styles.retry} href="/catalog">Повторить загрузку каталога</Link></div>
          : state === "long" ? <ProductGrid products={[longProduct, longUnit]} />
          : state === "loading" ? <CatalogLoading />
          : <ProductGrid products={[]} emptyKind="results" />}
      </div>
    </section>
  );
}

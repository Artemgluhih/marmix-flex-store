import Image from "next/image";
import Link from "next/link";
import type { PublicProduct } from "@/lib/catalog/types";
import { evaluateCommerce } from "@/lib/catalog/commerce";
import { CardCartAction } from "./CardCartAction";
import styles from "./ProductGrid.module.css";

const rubles = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

function Price({ product }: { product: PublicProduct }) {
  if (product.priceMinor === null) {
    return <span className={styles.unknownPrice} aria-label="Цена не указана">—</span>;
  }

  return (
    <strong className={styles.price}>
      {rubles.format(product.priceMinor / 100)} ₽
      {product.priceUnit && <small> / {product.priceUnit}</small>}
    </strong>
  );
}

export function ProductGrid({ products, emptyMessage, emptyKind = "catalog", linkToDetail = false, titleLevel = 2 }: { products: PublicProduct[]; emptyMessage?: string; emptyKind?: "catalog" | "results"; linkToDetail?: boolean; titleLevel?: 2 | 3 }) {
  if (products.length === 0) {
    return <div className={styles.empty} role="status"><h2>{emptyKind === "catalog" ? "Каталог пуст" : "Материалы не найдены"}</h2><p>{emptyMessage ?? (emptyKind === "catalog" ? "Сейчас нет опубликованных материалов." : "По выбранным параметрам ничего не найдено.")}</p></div>;
  }

  return (
    <div className={styles.grid}>
      {products.map((product) => {
        // Public callers pass T039 REAL/published/unarchived rows; review route uses a labeled render-only fixture.
        const commerce = evaluateCommerce(product, true);
        return (
        <article className={styles.card} key={product.id}>
          <div className={styles.imageFrame}>
            {linkToDetail && <Link className={styles.imageLink} href={`/product/${product.slug}`}
              aria-label={`Подробнее о материале «${product.name}»`} />}
            {product.primaryImage ? (
              <Image
                src={product.primaryImage.url}
                alt={product.primaryImage.alt ?? ""}
                fill
                loading="lazy"
                sizes="(max-width: 620px) calc(100vw - 40px), (max-width: 1120px) calc((100vw - 64px) / 2), min(30vw, 535px)"
              />
            ) : <span className={styles.noImage}>Изображение не добавлено</span>}
            {commerce?.commercialStatus === "ready" && <CardCartAction productId={product.id}
              name={product.name} model={commerce}
              snapshot={{ name: product.name, primaryImageUrl: product.primaryImage?.url ?? null,
                priceMinor: product.priceMinor, currency: product.currency,
                priceUnit: product.priceUnit, saleUnit: product.saleUnit }} />}
          </div>
          <div className={styles.info}>
            {product.series && <p className={styles.series}>{product.series}</p>}
            {titleLevel === 3 ? <h3 className={styles.name}>{linkToDetail ? <Link href={`/product/${product.slug}`}>{product.name}</Link> : product.name}</h3>
              : <h2 className={styles.name}>{linkToDetail ? <Link href={`/product/${product.slug}`}>{product.name}</Link> : product.name}</h2>}
            <div className={styles.commercial}>
              <Price product={product} />
              {product.saleUnit === "sheet" && <span className={styles.saleUnit}>Продажа листами</span>}
            </div>
            {linkToDetail && <Link className={styles.detailLink} href={`/product/${product.slug}`}
              aria-label={`Подробнее о материале «${product.name}»`}>Подробнее <span aria-hidden="true">→</span></Link>}
          </div>
        </article>
      ); })}
    </div>
  );
}

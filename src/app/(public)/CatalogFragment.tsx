import Image from "next/image";
import Link from "next/link";
import type { PublicProduct } from "@/lib/catalog/types";
import { evaluateCommerce } from "@/lib/catalog/commerce";
import { CardCartAction } from "@/components/catalog/CardCartAction";
import base from "./page.module.css";
import styles from "./homeFragments.module.css";

const rubles = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

export function CatalogFragment({ products }: { products: PublicProduct[] }) {
  return (
    <section className={styles.catalog} id="catalog" aria-labelledby="catalog-title">
      <div className={styles.sectionHead} data-reveal>
        <div>
          <p className={base.eyebrow}>02 / Каталог</p>
          <h2 id="catalog-title">Выберите характер<br /><em>поверхности.</em></h2>
        </div>
        <p className={styles.sectionLead}>Рассмотрите фактуры и материалы в каталоге.</p>
      </div>
      {products.length > 0 ? (
        <div className={styles.productGrid} data-reveal>
          {products.map((product, index) => {
            const commerce = evaluateCommerce(product, true);
            return (
            <article className={styles.productCard} key={product.id}>
              <div className={styles.productImage}>
                <Link className={styles.productImageLink} href={`/product/${product.slug}`} aria-label={`Подробнее о материале «${product.name}»`} />
                {product.primaryImage ? <Image src={product.primaryImage.url} alt={product.primaryImage.alt ?? ""} fill loading="lazy" sizes="(max-width: 620px) calc(100vw - 40px), (max-width: 1120px) 50vw, min(30vw, 535px)" />
                  : <span className={styles.noImage}>Изображение не добавлено</span>}
                {commerce?.commercialStatus === "ready" && <CardCartAction productId={product.id} name={product.name} model={commerce}
                  snapshot={{ name: product.name, primaryImageUrl: product.primaryImage?.url ?? null,
                    priceMinor: product.priceMinor, currency: product.currency, priceUnit: product.priceUnit, saleUnit: product.saleUnit }} />}
              </div>
              <div className={styles.productInfo}>
                <div className={styles.productHeading}>
                  <div>
                    {product.series && <span className={styles.productType}>{product.series}</span>}
                    <h3><Link href={`/product/${product.slug}`}>{product.name}</Link></h3>
                  </div>
                  <span className={styles.productNumber}>{String(index + 1).padStart(2, "0")}</span>
                </div>
                <Link className={styles.productDetailLink} href={`/product/${product.slug}`} aria-label={`Подробнее о материале «${product.name}»`}>Подробнее <span aria-hidden="true">→</span></Link>
                <div className={styles.productBottom}>
                  {product.priceMinor === null ? <span className={styles.unknownPrice} aria-label="Цена не указана">—</span>
                    : <strong>{rubles.format(product.priceMinor / 100)} ₽{product.priceUnit && <small> / {product.priceUnit}</small>}</strong>}
                </div>
              </div>
            </article>
          ); })}
        </div>
      ) : (
        <div className={styles.catalogQuiet} data-reveal>
          <p>Все опубликованные материалы собраны в каталоге.</p>
        </div>
      )}
      <Link className={styles.catalogLink} href="/catalog">Перейти в каталог <span aria-hidden="true">→</span></Link>
    </section>
  );
}

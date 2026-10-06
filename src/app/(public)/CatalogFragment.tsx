"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { PublicCategory, PublicProduct } from "@/lib/catalog/types";
import { evaluateCommerce } from "@/lib/catalog/commerce";
import { CardCartAction } from "@/components/catalog/CardCartAction";
import base from "./page.module.css";
import styles from "./homeFragments.module.css";

const rubles = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

export function CatalogFragment({ products: allProducts, categories, categoryProducts }: {
  products: PublicProduct[]; categories: PublicCategory[]; categoryProducts: Record<string, PublicProduct[]>;
}) {
  const [active, setActive] = useState<string | null>(null);
  const products = active ? categoryProducts[active] ?? [] : allProducts;
  return (
    <section className={styles.catalog} id="catalog" aria-labelledby="catalog-title">
      <div className={styles.sectionHead} data-reveal>
        <div>
          <p className={base.eyebrow}>02 / Каталог</p>
          <h2 id="catalog-title">Выберите характер<br /><em>поверхности.</em></h2>
        </div>
        <p className={styles.sectionLead}>Рассмотрите фактуры и материалы в каталоге.</p>
      </div>
      <nav className={styles.featuredCategories} aria-label="Категории избранных материалов">
        <button type="button" aria-pressed={active === null} onClick={() => setActive(null)}>Все материалы</button>
        {categories.map((category) => <button type="button" key={category.id} aria-pressed={active === category.slug}
          onClick={() => setActive(category.slug)}>{category.name}</button>)}
      </nav>
      <div aria-live="polite" aria-atomic="false">
      {products.length > 0 ? (
        <div className={styles.productGrid}>
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
        <div className={styles.catalogQuiet}>
          <p>{active ? "В этой категории пока нет избранных материалов." : "Избранные материалы пока не добавлены. Все опубликованные материалы собраны в каталоге."}</p>
        </div>
      )}
      </div>
      <Link className={styles.catalogLink} href="/catalog">Перейти в каталог <span aria-hidden="true">→</span></Link>
    </section>
  );
}

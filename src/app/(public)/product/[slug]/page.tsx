import type { Metadata } from "next";
import { productMetadata } from "@/lib/seo/dynamic";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedProduct, getRelatedProducts } from "@/lib/catalog/queries";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { ProductGallery } from "./ProductGallery";
import { evaluateCommerce } from "@/lib/catalog/commerce";
import { QuantityBlock } from "./QuantityBlock";
import styles from "./product.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await getPublishedProduct((await params).slug);
  if (!product) notFound();
  return productMetadata(product);
}

const rubles = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
const measure = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 4 });

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getPublishedProduct(slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product);
  // getPublishedProduct only returns REAL, published, unarchived rows through the guest read.
  const quantityModel = evaluateCommerce(product, true);

  const availability = product.availabilityStatus === "in_stock" ? "В наличии"
    : product.availabilityStatus === "on_order" ? "Под заказ" : null;
  const saleUnit = product.saleUnit === "sheet" ? "лист" : product.saleUnit;
  const dimensions = product.saleUnit === "sheet" && product.widthMm !== null && product.heightMm !== null
    ? `${measure.format(product.widthMm / 10)} × ${measure.format(product.heightMm / 10)} см` : null;
  const facts = [
    ...(dimensions ? [{ label: "Размер листа", value: dimensions }] : []),
    ...(product.saleUnit === "sheet" && product.areaPerSaleUnitM2 !== null ? [{ label: "Площадь листа", value: `${measure.format(product.areaPerSaleUnitM2)} м²` }] : []),
    ...(product.thicknessMm !== null ? [{ label: "Толщина", value: `${measure.format(product.thicknessMm)} мм` }] : []),
  ];

  return (
    <article className={styles.product} aria-labelledby="product-title">
      <nav className={styles.breadcrumb} aria-label="Навигационная цепочка">
        <Link href="/">Главная</Link><span aria-hidden="true">/</span>
        <Link href="/catalog">Каталог</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className={styles.stage}>
        {product.images.length > 1 ? <ProductGallery images={product.images} /> : (
          <div className={styles.media}>
            {product.images[0] ? (
              <Image src={product.images[0].url} alt={product.images[0].alt ?? ""}
                fill loading="eager" sizes="(max-width: 800px) calc(100vw - 40px), min(48vw, 680px)" />
            ) : <span className={styles.noImage}>Изображение не добавлено</span>}
          </div>
        )}

        <div className={styles.identity}>
          {product.series && <p className={styles.series}>{product.series}</p>}
          <h1 id="product-title">{product.name}</h1>
          <p className={styles.sku}>Артикул: {product.sku}</p>

          <div className={styles.commercial}>
            {product.priceMinor !== null && (
              <p className={styles.price}>{rubles.format(product.priceMinor / 100)} ₽
                {product.priceUnit && <span> / {product.priceUnit}</span>}
              </p>
            )}
            {saleUnit && <p className={styles.fact}>Единица продажи: {saleUnit}</p>}
            {availability && <p className={styles.fact}>Наличие: {availability}</p>}
            {quantityModel && <QuantityBlock model={quantityModel} productId={product.id}
              snapshot={{ name: product.name, primaryImageUrl: product.primaryImage?.url ?? null,
                priceMinor: product.priceMinor, currency: product.currency,
                priceUnit: product.priceUnit, saleUnit: product.saleUnit }} />}
          </div>
        </div>
      </div>
      {facts.length > 0 && (
        <section className={styles.facts} aria-labelledby="facts-title">
          <h2 id="facts-title">Характеристики</h2>
          <dl>
            {facts.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </section>
      )}
      {related.length > 0 && (
        <section className={styles.related} aria-labelledby="related-title">
          <h2 id="related-title">Похожие материалы</h2>
          <ProductGrid products={related} linkToDetail titleLevel={3} />
        </section>
      )}
    </article>
  );
}

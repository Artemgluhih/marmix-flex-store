import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedProduct } from "@/lib/catalog/queries";
import styles from "./product.module.css";

export const dynamic = "force-dynamic";

const rubles = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getPublishedProduct(slug);
  if (!product) notFound();

  const availability = product.availabilityStatus === "in_stock" ? "В наличии"
    : product.availabilityStatus === "on_order" ? "Под заказ" : null;
  const saleUnit = product.saleUnit === "sheet" ? "лист" : product.saleUnit;

  return (
    <article className={styles.product} aria-labelledby="product-title">
      <nav className={styles.breadcrumb} aria-label="Навигационная цепочка">
        <Link href="/">Главная</Link><span aria-hidden="true">/</span>
        <Link href="/catalog">Каталог</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className={styles.stage}>
        <div className={styles.media}>
          {product.primaryImage ? (
            <Image src={product.primaryImage.url} alt={product.primaryImage.alt ?? product.name}
              fill loading="eager" sizes="(max-width: 800px) calc(100vw - 40px), min(48vw, 680px)" />
          ) : <span className={styles.noImage}>Изображение не добавлено</span>}
        </div>

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
          </div>
        </div>
      </div>
    </article>
  );
}

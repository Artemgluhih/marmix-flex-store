import Image from "next/image";
import type { PublicProduct } from "@/lib/catalog/types";
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

export function ProductGrid({ products, emptyMessage, emptyKind = "catalog" }: { products: PublicProduct[]; emptyMessage?: string; emptyKind?: "catalog" | "results" }) {
  if (products.length === 0) {
    return <div className={styles.empty} role="status"><h2>{emptyKind === "catalog" ? "Каталог пуст" : "Материалы не найдены"}</h2><p>{emptyMessage ?? (emptyKind === "catalog" ? "Сейчас нет опубликованных материалов." : "По выбранным параметрам ничего не найдено.")}</p></div>;
  }

  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <article className={styles.card} key={product.id}>
          <div className={styles.imageFrame}>
            {product.primaryImage ? (
              <Image
                src={product.primaryImage.url}
                alt={product.primaryImage.alt ?? ""}
                fill
                loading="lazy"
                sizes="(max-width: 620px) calc(100vw - 40px), (max-width: 1120px) calc((100vw - 64px) / 2), min(30vw, 535px)"
              />
            ) : <span className={styles.noImage}>Изображение не добавлено</span>}
          </div>
          <div className={styles.info}>
            {product.series && <p className={styles.series}>{product.series}</p>}
            <h2 className={styles.name}>{product.name}</h2>
            <div className={styles.commercial}>
              <Price product={product} />
              {product.saleUnit === "sheet" && <span className={styles.saleUnit}>Продажа листами</span>}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

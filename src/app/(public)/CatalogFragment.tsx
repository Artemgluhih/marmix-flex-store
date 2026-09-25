"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import base from "./page.module.css";
import styles from "./homeFragments.module.css";

type DemoMaterial = {
  id: "light" | "dark" | "warm";
  name: string;
  type: string;
  image: string;
  price: string;
  number: string;
};

// Presentation data from the approved prototype. These are not products, SKUs or sale prices.
const DEMO_MATERIALS: readonly DemoMaterial[] = [
  { id: "light", name: "Ivory Vein", type: "Светлый / демонстрационный", image: "/images/showroom/ivory-vein.webp", price: "4 990", number: "01" },
  { id: "dark", name: "Graphite Vein", type: "Графит / демонстрационный", image: "/images/showroom/graphite-vein.webp", price: "5 490", number: "02" },
  { id: "warm", name: "Warm Strata", type: "Тёплый / демонстрационный", image: "/images/showroom/warm-strata.webp", price: "4 790", number: "03" },
];

const FILTERS = [
  { id: "all", label: "Все" },
  { id: "light", label: "Светлые" },
  { id: "dark", label: "Тёмные" },
  { id: "warm", label: "Тёплые" },
] as const;

type DemoFilter = (typeof FILTERS)[number]["id"];

export function CatalogFragment() {
  const [filter, setFilter] = useState<DemoFilter>("all");
  const [selected, setSelected] = useState<DemoMaterial | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const visible = filter === "all" ? DEMO_MATERIALS : DEMO_MATERIALS.filter((material) => material.id === filter);

  function openTexture(material: DemoMaterial) {
    setSelected(material);
    dialogRef.current?.showModal();
  }

  function closeTexture() {
    dialogRef.current?.close();
  }

  return (
    <section className={styles.catalog} id="catalog" aria-labelledby="catalog-title">
      <div className={styles.sectionHead}>
        <div>
          <p className={base.eyebrow}>02 / Фрагмент каталога</p>
          <h2 id="catalog-title">Выберите характер<br /><em>поверхности.</em></h2>
        </div>
        <p className={styles.sectionLead}>Светлая глубина, графичный контраст или тёплый природный ритм — три демонстрационных образца для проверки языка каталога.</p>
      </div>
      <div className={styles.catalogControls}>
        <div className={styles.filters} role="group" aria-label="Фильтр демонстрационных материалов">
          {FILTERS.map((item) => (
            <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>
              {item.label}{item.id === "all" && <span>03</span>}
            </button>
          ))}
        </div>
        <span className={styles.catalogCount} aria-live="polite">{String(visible.length).padStart(2, "0")} {visible.length === 1 ? "материал" : "материала"}</span>
      </div>
      <div className={styles.productGrid}>
        {visible.map((material) => (
          <article className={styles.productCard} key={material.id}>
            <button className={styles.productImage} type="button" onClick={() => openTexture(material)} aria-label={`Рассмотреть демонстрационную фактуру ${material.name} крупно`}>
              <Image src={material.image} alt="" fill sizes="(max-width: 620px) 100vw, (max-width: 1120px) 50vw, 33vw" />
              <span className={styles.imageZoom} aria-hidden="true">↗</span>
            </button>
            <div className={styles.productInfo}>
              <div className={styles.productHeading}>
                <div>
                  <span className={styles.productType}>{material.type}</span>
                  <h3>{material.name}</h3>
                </div>
                <span className={styles.productNumber}>{material.number}</span>
              </div>
              <div className={styles.productBottom}>
                <div>
                  <span className={styles.priceLabel}>Цена для макета*</span>
                  <strong>{material.price} ₽ <small>/ м²</small></strong>
                </div>
                <button className={styles.productAction} type="button" onClick={() => openTexture(material)}>Смотреть фактуру <span aria-hidden="true">↗</span></button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className={styles.catalogDisclaimer}>* Названия, образцы и цены созданы для визуального прототипа. Они не описывают ассортимент и актуальные предложения Marmix Flex.</p>
      <Link className={styles.catalogLink} href="/catalog">Перейти в каталог <span aria-hidden="true">→</span></Link>
      <dialog className={styles.textureDialog} ref={dialogRef} aria-labelledby="dialog-title" onClose={() => setSelected(null)} onClick={(event) => { if (event.target === dialogRef.current) closeTexture(); }}>
        {selected && (
          <>
            <div className={styles.dialogTop}>
              <span className={base.eyebrow}>Рассмотреть фактуру</span>
              <button type="button" className={styles.dialogClose} onClick={closeTexture} aria-label="Закрыть просмотр">Закрыть ×</button>
            </div>
            <Image className={styles.dialogImage} src={selected.image} width={1000} height={650} alt={`Демонстрационная фактура ${selected.name} крупно`} />
            <div className={styles.dialogBottom}>
              <h2 id="dialog-title">{selected.name}</h2>
              <p>Демонстрационная визуализация. Цвет и рисунок конкретного товара необходимо проверить по образцу.</p>
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}

"use client";

import Image from "next/image";
import { useState, type KeyboardEvent } from "react";
import type { PublicImage } from "@/lib/catalog/types";
import styles from "./ProductGallery.module.css";

export function ProductGallery({ images }: { images: PublicImage[] }) {
  const [active, setActive] = useState(() => Math.max(0, images.findIndex((image) => image.isPrimary)));
  const image = images[active] ?? images[0];
  if (!image) return null;

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    setActive((index) => Math.max(0, Math.min(images.length - 1, index + (event.key === "ArrowRight" ? 1 : -1))));
  }

  return (
    <div className={styles.gallery} role="region" aria-label="Фотографии товара" tabIndex={0} onKeyDown={onKeyDown}>
      <div className={styles.frame}>
        <Image key={`${image.url}-${active}`} src={image.url} alt={image.alt ?? ""} fill
          loading={image.isPrimary ? "eager" : "lazy"}
          sizes="(max-width: 800px) calc(100vw - 40px), min(48vw, 680px)" />
      </div>
      <div className={styles.selectors} role="group" aria-label="Выбор изображения">
        {images.map((item, index) => (
          <button className={styles.selector} type="button" key={`${item.url}-${index}`}
            aria-label={`Показать изображение ${index + 1}${item.alt ? `: ${item.alt}` : ""}`}
            aria-pressed={active === index} onClick={() => setActive(index)}>
            <Image src={item.url} alt="" fill loading="lazy" sizes="82px" />
          </button>
        ))}
      </div>
      <span className={styles.announcement} aria-live="polite">Изображение {active + 1} из {images.length}</span>
    </div>
  );
}

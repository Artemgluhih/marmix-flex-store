"use client";

import Image from "next/image";
import { useState, type KeyboardEvent, type TouchEvent } from "react";
import styles from "../editorial.module.css";

const frames = [
  { src: "/images/editorial/application-02.webp", alt: "Тёмная каменная поверхность в светлом интерьере", position: "50% 48%" },
  { src: "/images/editorial/application-12.webp", alt: "Светлая каменная плоскость в сдержанном интерьере", position: "50% 50%" },
  { src: "/images/editorial/application-55.webp", alt: "Тёмная каменная плоскость с мягкой подсветкой и зеленью", position: "50% 53%" },
  { src: "/images/editorial/application-17.webp", alt: "Синяя фактурная плоскость в интерьере с деревянными деталями", position: "50% 50%" },
  { src: "/images/editorial/application-57.webp", alt: "Крупная светлая каменная плоскость в сдержанном пространстве", position: "50% 50%" },
  { src: "/images/editorial/application-40.webp", alt: "Каменная поверхность с тёплым рисунком и подсветкой", position: "50% 47%" },
] as const;

export function ApplicationCarousel() {
  const [index, setIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const current = frames[index];
  const next = frames[index + 1];

  function move(delta: number) {
    setIndex((value) => Math.max(0, Math.min(frames.length - 1, value + delta)));
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      move(event.key === "ArrowLeft" ? -1 : 1);
    }
  }

  function onTouchEnd(event: TouchEvent<HTMLElement>) {
    if (touchStart === null) return;
    const distance = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(distance) > 45) move(distance < 0 ? 1 : -1);
    setTouchStart(null);
  }

  return (
    <section className={styles.carouselSection} aria-labelledby="application-carousel-title">
      <div className={styles.carouselHeading}>
        <div><p className={styles.eyebrow}>05 / Визуальные примеры</p><h2 id="application-carousel-title">Поверхность<br />в разных пространствах</h2></div>
        <p>Подборка из подтверждённого media set. Происхождение кадров смешанное: они показаны как визуальные примеры, без утверждения об авторстве Marmix Flex.</p>
      </div>
      <div className={styles.carousel} role="region" aria-roledescription="карусель" aria-label="Визуальные примеры применения" tabIndex={0} onKeyDown={onKeyDown} onTouchStart={(event) => setTouchStart(event.touches[0].clientX)} onTouchEnd={onTouchEnd}>
        <div className={styles.carouselViewport}>
          <figure className={styles.carouselFrame} key={current.src}>
            <div className={styles.carouselImage}><Image src={current.src} alt={current.alt} fill sizes="(max-width: 620px) 88vw, 70vw" style={{ objectPosition: current.position }} /></div>
            <figcaption>Материал в интерьере · визуальный пример</figcaption>
          </figure>
          {next && <div className={styles.carouselPeek} aria-hidden="true"><Image src={next.src} alt="" fill sizes="(max-width: 620px) 20vw, 15vw" style={{ objectPosition: next.position }} /></div>}
        </div>
        <div className={styles.carouselControls}>
          <span className={styles.carouselCounter} aria-live="polite" aria-atomic="true">{String(index + 1).padStart(2, "0")} <span>/</span> {String(frames.length).padStart(2, "0")}</span>
          <div><button type="button" aria-label="Предыдущее изображение" onClick={() => move(-1)} disabled={index === 0}>←</button><button type="button" aria-label="Следующее изображение" onClick={() => move(1)} disabled={index === frames.length - 1}>→</button></div>
        </div>
      </div>
    </section>
  );
}

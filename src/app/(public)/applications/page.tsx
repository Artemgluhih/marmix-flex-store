import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "../editorial.module.css";

export const metadata: Metadata = { title: "Примеры применения — Marmix Flex" };

export default function ApplicationsPage() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Marmix Flex / В пространстве</p>
          <h1>Примеры<br />применения</h1>
        </div>
        <p className={styles.heroLead}>Визуальные образы помогают увидеть фактуру в масштабе пространства и вблизи. Это отправная точка для выбора материала в каталоге.</p>
      </header>

      <figure className={styles.stage}>
        <div className={styles.stageImage}>
          <Image src="/images/showroom/interior-room.webp" alt="Интерьерная визуализация: светлая фактурная плоскость в пространстве" fill sizes="(max-width: 620px) 100vw, 90vw" priority />
        </div>
        <figcaption className={styles.caption}><span>01 / Материал в интерьере</span><span>Интерьерная визуализация</span></figcaption>
      </figure>

      <section className={`${styles.section} ${styles.split}`} aria-labelledby="texture-title">
        <figure className={styles.mediaFigure}>
          <div className={styles.mediaImage}>
            <Image src="/images/showroom/ivory-vein.webp" alt="Демонстрационная светлая фактура с серыми прожилками" fill sizes="(max-width: 620px) 100vw, 48vw" />
          </div>
          <figcaption className={styles.caption}><span>02 / Вблизи</span><span>Демонстрационная фактура · не SKU</span></figcaption>
        </figure>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>От общего к детали</p>
          <h2 id="texture-title">Фактура<br />и масштаб</h2>
          <p>Крупный кадр показывает ритм плоскости. Близкий взгляд — линии и переходы рисунка. Сопоставление этих масштабов помогает представить характер поверхности.</p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.gallerySection}`} aria-labelledby="space-title">
        <div className={styles.galleryHeading}>
          <p className={styles.eyebrow}>Образы материала</p>
          <h2 id="space-title">В пространстве</h2>
          <p className={styles.sectionIntro}>Интерьерный образ и демонстрационная фактура показывают визуальное направление. Изображения не являются фотографиями реализованных объектов или конкретных товаров Marmix Flex.</p>
        </div>
        <div className={styles.galleryGrid}>
          <figure>
            <div className={styles.galleryImage}>
              <Image src="/images/showroom/hero-room.webp" alt="Визуализация интерьера с крупной светлой фактурной поверхностью" fill sizes="(max-width: 620px) 100vw, 53vw" />
            </div>
            <figcaption className={styles.caption}><span>03 / Интерьерный образ</span><span>Интерьерная визуализация</span></figcaption>
          </figure>
          <figure>
            <div className={styles.galleryImage}>
              <Image src="/images/showroom/graphite-vein.webp" alt="Демонстрационная тёмная фактура с тонкими светлыми линиями" fill sizes="(max-width: 620px) 100vw, 38vw" />
            </div>
            <figcaption className={styles.caption}><span>04 / Рисунок поверхности</span><span>Демонстрационная фактура · не SKU</span></figcaption>
          </figure>
        </div>
      </section>

      <section className={styles.closing} aria-labelledby="applications-cta">
        <div>
          <p className={styles.eyebrow}>Продолжить выбор</p>
          <h2 id="applications-cta">От образа<br />к материалу</h2>
          <p>В каталоге представлены реальные опубликованные товары Marmix Flex.</p>
        </div>
        <Link className={styles.catalogLink} href="/catalog">Перейти в каталог <span aria-hidden="true">↗</span></Link>
      </section>
    </div>
  );
}

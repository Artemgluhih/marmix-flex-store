import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "../editorial.module.css";
import { EditorialContact } from "../EditorialContact";
import { ApplicationCarousel } from "./ApplicationCarousel";

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

      <section className={styles.editorialInterlude} aria-labelledby="light-title">
        <div className={styles.lightCopy}>
          <p className={styles.eyebrow}>03 / Восприятие</p>
          <h2 id="light-title">Свет меняет<br />впечатление</h2>
          <p>На большой плоскости рисунок воспринимается целиком; с другого расстояния становятся заметны линии и переходы. Свет и соседние предметы меняют визуальный ритм поверхности — поэтому полезно смотреть и на интерьерный кадр, и на фактуру вблизи.</p>
        </div>
        <figure className={styles.lightVisual}><div className={styles.lightImage}><Image src="/images/editorial/application-05.webp" alt="Светлая каменная поверхность рядом с окном" fill sizes="(max-width: 620px) 100vw, 53vw" /></div><figcaption className={styles.caption}><span>Поверхность и свет</span><span>Визуальный пример · без заявления об авторстве</span></figcaption></figure>
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

      <ApplicationCarousel />

      <section className={styles.editorialPair} aria-label="Как смотреть на фактуру">
        <figure className={styles.editorialFigure}><div className={styles.editorialFigureImage}><Image src="/images/editorial/application-26.webp" alt="Каменная поверхность в общем интерьерном кадре" fill sizes="(max-width: 620px) 100vw, 49vw" /></div><figcaption><p className={styles.eyebrow}>06 / Масштаб</p><h2>Рисунок на плоскости</h2><p>На общем плане видны пропорции поверхности и рисунок рядом с архитектурой, мебелью и светом. Так проще оценить, какое место фактура занимает в пространстве.</p><span>Интерьерный визуальный пример · авторство объекта не заявлено</span></figcaption></figure>
        <figure className={styles.editorialFigure}><div className={styles.editorialFigureImage}><Image src="/images/editorial/application-07.webp" alt="Крупный план светлой фактурной поверхности" fill sizes="(max-width: 620px) 100vw, 39vw" /></div><figcaption><p className={styles.eyebrow}>07 / Деталь</p><h2>Фактура рядом</h2><p>При близком взгляде линии и переходы читаются отдельно от общей композиции. Сопоставьте деталь с интерьерным кадром, чтобы увидеть разницу в масштабе рисунка.</p><span>Визуальный пример фактуры · без заявления об авторстве</span></figcaption></figure>
      </section>
      <EditorialContact id="applications-contacts-title" />

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

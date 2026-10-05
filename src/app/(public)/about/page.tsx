import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "../editorial.module.css";
import { EditorialContact } from "../EditorialContact";

export const metadata: Metadata = { title: "О Marmix Flex" };

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <header className={styles.aboutHero}>
        <div className={styles.aboutHeroCopy}>
          <p className={styles.eyebrow}>О бренде / Marmix Flex</p>
          <h1>Marmix Flex — декоративные материалы для интерьера</h1>
          <p>Marmix Flex — бренд декоративных отделочных материалов. В каталоге собраны поверхности с различными фактурами и рисунками, которые можно рассмотреть, сравнить и выбрать для своего пространства.</p>
          <Link className={styles.inlineLink} href="/catalog">Смотреть каталог <span aria-hidden="true">↗</span></Link>
        </div>
        <figure className={styles.aboutHeroVisual}>
          <div className={styles.aboutHeroImage}><Image src="/images/editorial/scene-ivory-lounge.webp" alt="Визуализация тёмного интерьера со светлой фактурной плоскостью" fill priority sizes="(max-width: 800px) 100vw, 48vw" /></div>
          <figcaption className={styles.caption}><span>Материал в интерьере</span><span>Интерьерная визуализация</span></figcaption>
        </figure>
      </header>

      <section className={`${styles.section} ${styles.aboutIntro}`} aria-labelledby="about-intro-title">
        <div className={styles.aboutIntroCopy}>
          <p className={styles.eyebrow}>01 / Знакомство</p>
          <h2 id="about-intro-title">Что такое<br />Marmix Flex</h2>
          <p>Marmix Flex — бренд декоративных отделочных материалов. В каталоге представлены реальные опубликованные товары: изображения и подтверждённые характеристики помогают сравнить поверхности и выбрать материал для своего пространства.</p>
          <p>Фактуру и рисунок можно рассмотреть визуально, а размеры, единицы продажи и другие заполненные сведения — на странице конкретного товара. Демонстрационные образы на этой странице показывают настроение материала, но не являются изображениями SKU.</p>
          <p>Вы можете отправить заявку на расчёт. После её рассмотрения менеджер связывается с вами и уточняет детали. Заявка сама по себе не подтверждает покупку и не резервирует товар.</p>
          <div className={styles.introAside}><span>В каталоге</span><strong>Гибкий мрамор · Травертин · Сопутствующие материалы</strong></div>
        </div>
        <figure className={styles.aboutIntroVisual}>
          <div className={styles.introImage}><Image src="/images/editorial/scene-dark-gallery.webp" alt="Визуализация тёмного архитектурного пространства с фактурной плоскостью" fill sizes="(max-width: 620px) 100vw, 44vw" /></div>
          <figcaption className={styles.caption}><span>Материал в пространстве</span><span>Архитектурная визуализация · не SKU</span></figcaption>
        </figure>
      </section>

      <section className={`${styles.section} ${styles.aboutMaterials}`} aria-labelledby="about-materials-title">
        <div className={styles.sectionHeadingRow}>
          <div><p className={styles.eyebrow}>02 / Каталог</p><h2 id="about-materials-title">Что представлено</h2></div>
          <p>Гибкий мрамор, травертин и сопутствующие материалы — подтверждённые группы каталога. Изображения ниже демонстрируют характер фактуры и не представляют конкретные товары.</p>
        </div>
        <div className={styles.materialGrid}>
          <figure><div className={`${styles.materialImage} ${styles.materialImageDark}`}><Image src="/images/showroom/graphite-vein.webp" alt="Тёмная демонстрационная фактура с природным рисунком" fill sizes="(max-width: 620px) 100vw, 45vw" /></div><figcaption className={styles.caption}><span>Тёмная фактура</span><span>Демонстрационный образ · не SKU</span></figcaption></figure>
          <figure><div className={`${styles.materialImage} ${styles.materialImageLight}`}><Image src="/images/showroom/ivory-vein.webp" alt="Светлая демонстрационная фактура с тонкими прожилками" fill sizes="(max-width: 620px) 100vw, 45vw" /></div><figcaption className={styles.caption}><span>Светлая фактура</span><span>Демонстрационный образ · не SKU</span></figcaption></figure>
        </div>
        <p className={styles.materialNote}>Сопутствующие материалы также представлены в каталоге. Состав и актуальные данные каждого товара смотрите на его странице.</p>
      </section>

      <section className={`${styles.section} ${styles.aboutProcess}`} aria-labelledby="about-process-title">
        <div className={styles.sectionHeadingRow}>
          <div><p className={styles.eyebrow}>03 / Порядок взаимодействия</p><h2 id="about-process-title">Как происходит работа</h2></div>
          <p>Заявка помогает обсудить материал и расчёт. Она не резервирует товар и не означает подтверждённую покупку или оплату.</p>
        </div>
        <ol className={styles.processList}>
          <li><span>01</span><div><h3>Вы выбираете материал</h3><p>Смотрите каталог, изображения и подтверждённые характеристики.</p></div></li>
          <li><span>02</span><div><h3>Отправляете заявку</h3><p>Заявка — это запрос на расчёт и связь с менеджером.</p></div></li>
          <li><span>03</span><div><h3>Согласовываются условия</h3><p>После рассмотрения заявки менеджер связывается с клиентом и уточняет детали. Условия оплаты согласовываются после рассмотрения заявки.</p></div></li>
        </ol>
      </section>

      <section className={`${styles.section} ${styles.aboutSpace}`} aria-labelledby="about-space-title">
        <div className={styles.aboutSpaceLead}>
          <figure><div className={styles.aboutSpaceImage}><Image src="/images/editorial/scene-slate-wall.webp" alt="Архитектурная визуализация с крупной графитовой фактурной стеной" fill sizes="(max-width: 800px) 100vw, 60vw" /></div><figcaption className={styles.caption}><span>Материал в пространстве</span><span>Интерьерная визуализация · не SKU</span></figcaption></figure>
          <div><p className={styles.eyebrow}>04 / В пространстве</p><h2 id="about-space-title">Marmix Flex<br />в пространстве</h2><p>Интерьерный образ показывает масштаб поверхности, а близкие кадры — характер рисунка. Визуализации и демонстрационные фактуры не являются фотографиями реализованных объектов или конкретных SKU.</p></div>
        </div>
        <div className={styles.aboutTextureGrid}>
          <figure><div className={styles.aboutTextureImage}><Image src="/images/showroom/warm-strata.webp" alt="Тёплая демонстрационная фактура крупным планом" fill sizes="(max-width: 620px) 100vw, 46vw" /></div><figcaption className={styles.caption}><span>Рисунок вблизи</span><span>Демонстрационная фактура · не SKU</span></figcaption></figure>
          <figure><div className={styles.aboutTextureImage}><Image src="/images/editorial/scene-warm-gallery.webp" alt="Визуализация тёплой фактурной плоскости в тёмном пространстве" fill sizes="(max-width: 620px) 100vw, 46vw" /></div><figcaption className={styles.caption}><span>Рисунок в масштабе</span><span>Архитектурная визуализация · не SKU</span></figcaption></figure>
        </div>
      </section>

      <section className={styles.closing} aria-labelledby="about-cta">
        <div><p className={styles.eyebrow}>Продолжить выбор</p><h2 id="about-cta">Выберите материал<br />для своего пространства</h2><p>Изображения и подтверждённые сведения о товарах собраны в каталоге.</p></div>
        <Link className={styles.catalogLink} href="/catalog">Перейти в каталог <span aria-hidden="true">↗</span></Link>
      </section>
      <EditorialContact id="about-contacts-title" />
    </div>
  );
}

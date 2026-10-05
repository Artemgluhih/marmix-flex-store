import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "../editorial.module.css";

export const metadata: Metadata = { title: "О Marmix Flex" };

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Бренд / Материал</p>
          <h1>О Marmix Flex</h1>
        </div>
        <p className={styles.heroLead}>Marmix Flex — бренд декоративных материалов. Здесь выбор начинается с рисунка, фактуры и того, как поверхность воспринимается в пространстве.</p>
      </header>

      <section className={`${styles.section} ${styles.brandStatement}`} aria-labelledby="material-title">
        <p className={styles.eyebrow}>Подход к выбору</p>
        <h2 id="material-title">Материал как часть пространства</h2>
        <p className={styles.sectionIntro}>В каталоге можно рассмотреть опубликованные материалы и их подтверждённые характеристики. Интерьерные визуализации помогают представить масштаб рисунка, сохраняя различие между образом и конкретным товаром.</p>
      </section>

      <figure className={styles.stage}>
        <div className={styles.stageImage}>
          <Image src="/images/showroom/hero-room.webp" alt="Визуализация пространства с выразительной светлой поверхностью" fill sizes="(max-width: 620px) 100vw, 90vw" />
        </div>
        <figcaption className={styles.caption}><span>Материал в интерьере</span><span>Интерьерная визуализация · не реализованный объект</span></figcaption>
      </figure>

      <section className={`${styles.section} ${styles.cities}`} aria-labelledby="cities-title">
        <div>
          <p className={styles.eyebrow}>Подтверждённые города присутствия</p>
          <h2 id="cities-title">Сургут · Москва</h2>
        </div>
        <p className={styles.citiesText}>Marmix Flex представлен в Сургуте и Москве. Здесь указаны города присутствия — без адресов и условий посещения.</p>
      </section>

      <section className={styles.closing} aria-labelledby="about-cta">
        <div>
          <p className={styles.eyebrow}>Материалы Marmix Flex</p>
          <h2 id="about-cta">Начните<br />с фактуры</h2>
          <p>Перейдите к опубликованным товарам и сравните их изображения и подтверждённые данные.</p>
        </div>
        <Link className={styles.catalogLink} href="/catalog">Перейти в каталог <span aria-hidden="true">↗</span></Link>
      </section>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <>
      <section className={styles.hero} aria-labelledby="hero-title">
        <Image className={styles.heroImage} src="/images/showroom/hero-room.webp" alt="" fill preload sizes="(max-width: 1800px) 100vw, 1800px" />
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}><span className={styles.eyebrowLine} />Гибкий мрамор · Сургут</p>
          <h1 id="hero-title">Природа.<br />В масштабе<br /><em>пространства.</em></h1>
          <p className={styles.heroDescription}>Поверхности с выразительным рисунком для интерьеров, в которых материал задаёт настроение.</p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} href="/catalog">Смотреть материалы <span aria-hidden="true">↗</span></Link>
            <a className={styles.textLink} href="#materials">Узнать о фактуре <span aria-hidden="true">→</span></a>
          </div>
        </div>
        <div className={styles.heroFoot}>
          <span>01 / Поверхность как часть архитектуры</span>
          <span>Листайте вниз <span aria-hidden="true">↓</span></span>
        </div>
      </section>
      <section className={styles.showcase} id="materials" aria-labelledby="showcase-title">
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.eyebrow}>01 / Материал</p>
            <h2 id="showcase-title">От пространства<br />до <em>фактуры.</em></h2>
          </div>
          <p className={styles.sectionLead}>Рисунок раскрывается по-разному: на большой плоскости и в деталях. Сначала почувствуйте масштаб, затем рассмотрите поверхность.</p>
        </div>
        <div className={styles.showcaseGrid}>
          <figure className={styles.showcaseRoom}>
            <div className={styles.imageFrame}>
              <Image src="/images/showroom/interior-room.webp" alt="Визуализация светлой каменной стены в современном интерьере" fill sizes="(max-width: 620px) 100vw, (max-width: 800px) 55vw, 56vw" />
            </div>
            <figcaption><span>01 / В пространстве</span><span>Интерьерная визуализация</span></figcaption>
          </figure>
          <figure className={styles.showcaseDetail}>
            <div className={styles.imageFrame}>
              <Image src="/images/showroom/ivory-vein.webp" alt="Демонстрационная светлая фактура с серыми прожилками" fill sizes="(max-width: 620px) 100vw, (max-width: 800px) 45vw, 40vw" />
            </div>
            <figcaption><span>02 / Вблизи</span><span>Демонстрационная фактура</span></figcaption>
          </figure>
        </div>
        <p className={styles.showcaseNote}>Изображения этого прототипа — визуализации направления, не фотографии конкретных товаров Marmix Flex.</p>
      </section>
    </>
  );
}

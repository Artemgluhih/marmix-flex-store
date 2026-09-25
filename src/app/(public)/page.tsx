import Image from "next/image";
import Link from "next/link";
import { CatalogFragment } from "./CatalogFragment";
import { MotionReveal } from "./MotionReveal";
import styles from "./page.module.css";
import fragments from "./homeFragments.module.css";

export default function HomePage() {
  return (
    <>
      <MotionReveal />
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
        <div className={styles.sectionHead} data-reveal>
          <div>
            <p className={styles.eyebrow}>01 / Материал</p>
            <h2 id="showcase-title">От пространства<br />до <em>фактуры.</em></h2>
          </div>
          <p className={styles.sectionLead}>Рисунок раскрывается по-разному: на большой плоскости и в деталях. Сначала почувствуйте масштаб, затем рассмотрите поверхность.</p>
        </div>
        <div className={styles.showcaseGrid}>
          <figure className={styles.showcaseRoom} data-reveal>
            <div className={styles.imageFrame}>
              <Image src="/images/showroom/interior-room.webp" alt="Визуализация светлой каменной стены в современном интерьере" fill sizes="(max-width: 620px) 100vw, (max-width: 800px) 55vw, 56vw" />
            </div>
            <figcaption><span>01 / В пространстве</span><span>Интерьерная визуализация</span></figcaption>
          </figure>
          <figure className={styles.showcaseDetail} data-reveal>
            <div className={styles.imageFrame}>
              <Image src="/images/showroom/ivory-vein.webp" alt="Демонстрационная светлая фактура с серыми прожилками" fill sizes="(max-width: 620px) 100vw, (max-width: 800px) 45vw, 40vw" />
            </div>
            <figcaption><span>02 / Вблизи</span><span>Демонстрационная фактура</span></figcaption>
          </figure>
        </div>
        <p className={styles.showcaseNote}>Изображения этого прототипа — визуализации направления, не фотографии конкретных товаров Marmix Flex.</p>
      </section>
      <CatalogFragment />
      <section className={fragments.interiors} id="interiors" aria-labelledby="interiors-title">
        <div className={fragments.interiorImage} data-reveal>
          <Image src="/images/showroom/hero-room.webp" alt="" fill sizes="(max-width: 800px) 100vw, 55vw" />
          <span>Визуализация / жилое пространство</span>
        </div>
        <div className={fragments.interiorCopy} data-reveal>
          <p className={styles.eyebrow}>03 / Применение</p>
          <h2 id="interiors-title">Поверхность,<br />которая становится<br /><em>архитектурой.</em></h2>
          <p>Материал работает не только в образце. Его масштаб, свет и окружение создают цельное впечатление от пространства.</p>
          <a className={styles.textLink} href="#materials">Посмотреть материал <span aria-hidden="true">↗</span></a>
        </div>
      </section>
      <section className={fragments.closing} id="contact" aria-labelledby="closing-title" data-reveal>
        <div className={fragments.closingText}>
          <p className={styles.eyebrow}>Marmix Flex / Сургут</p>
          <h2 id="closing-title">Начните с<br /><em>материала.</em></h2>
          <p>Сравните фактуры, найдите свой оттенок и представьте новую поверхность в вашем пространстве.</p>
          <a className={styles.primaryButton} href="#catalog">Вернуться к материалам <span aria-hidden="true">↗</span></a>
        </div>
        <div className={fragments.closingArt} aria-hidden="true">
          <span className={fragments.artOutline} />
          <span className={fragments.artStone} />
          <span className={fragments.artLabel}>M / F</span>
        </div>
      </section>
    </>
  );
}

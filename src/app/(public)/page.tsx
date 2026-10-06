import { createStaticMetadata } from "@/lib/seo/metadata";
import Image from "next/image";
import Link from "next/link";
import { CatalogFragment } from "./CatalogFragment";
import { MotionReveal } from "./MotionReveal";
import styles from "./page.module.css";
import fragments from "./homeFragments.module.css";
import { listPublishedCategories, listPublishedFeaturedProducts } from "@/lib/catalog/queries";

export const metadata = createStaticMetadata({
  path: "/",
  title: "Marmix Flex — декоративные отделочные материалы",
  description: "Каталог декоративных материалов Marmix Flex: гибкий мрамор, травертин и сопутствующие материалы. Сургут и Москва.",
  absoluteTitle: true,
});

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([listPublishedFeaturedProducts(), listPublishedCategories()]);
  return (
    <>
      <MotionReveal />
      <section className={styles.hero} aria-labelledby="hero-title">
        <Image className={styles.heroImage} src="/images/showroom/hero-room.webp" alt="" fill preload sizes="100vw" />
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
        <p className={styles.showcaseNote}>Визуализации направления — не фотографии конкретных товаров Marmix Flex.</p>
      </section>
      {categories.length > 0 && <section className={fragments.categorySection} aria-labelledby="material-categories-title">
        <div className={fragments.sectionHead}>
          <div><p className={styles.eyebrow}>Каталог / Навигация</p><h2 id="material-categories-title">Категории<br /><em>материалов.</em></h2></div>
          <p className={fragments.sectionLead}>Выберите группу и рассмотрите опубликованные материалы в каталоге.</p>
        </div>
        <nav className={fragments.categoryList} aria-label="Категории материалов">
          {categories.map((category, index) => <Link key={category.id} href={`/catalog/${category.slug}`}>
            <span className={fragments.categoryIndex}>{String(index + 1).padStart(2, "0")}</span>
            <span className={fragments.categoryName}>{category.name}</span><span aria-hidden="true">↗</span>
          </Link>)}
        </nav>
      </section>}
      <CatalogFragment products={featuredProducts} />
      <section className={fragments.interiors} id="interiors" aria-labelledby="interiors-title">
        <div className={fragments.interiorImage} data-reveal>
          <Image src="/images/showroom/hero-room.webp" alt="" fill sizes="(max-width: 800px) 100vw, 55vw" />
          <span>Визуализация / жилое пространство</span>
        </div>
        <div className={fragments.interiorCopy} data-reveal>
          <p className={styles.eyebrow}>03 / Применение</p>
          <h2 id="interiors-title">Поверхность,<br />которая становится<br /><em>архитектурой.</em></h2>
          <p>Масштаб, свет и окружение меняют восприятие фактуры в пространстве.</p>
          <a className={styles.textLink} href="#materials">Посмотреть материал <span aria-hidden="true">↗</span></a>
        </div>
      </section>
      <section className={fragments.closing} id="contact" aria-labelledby="closing-title" data-reveal>
        <div className={fragments.closingText}>
          <p className={styles.eyebrow}>Marmix Flex / Сургут</p>
          <h2 id="closing-title">Начните с<br /><em>материала.</em></h2>
          <p>Сравните фактуры, найдите свой оттенок и представьте новую поверхность в вашем пространстве.</p>
          <Link className={styles.primaryButton} href="/catalog">Перейти в каталог <span aria-hidden="true">↗</span></Link>
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

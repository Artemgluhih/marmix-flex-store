import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import styles from "./review.module.css";

export const metadata: Metadata = {
  title: "T037 — проверка представления медиа",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default function MediaPresentationReview() {
  if (process.env.VERCEL_ENV !== "preview") notFound();

  return <main className={styles.page}>
    <header className={styles.intro}>
      <p>T037 / Preview only</p>
      <h1>Проверка представления медиа</h1>
      <p>Узкий образец из подтверждённого T010 manifest. Это не каталог и не утверждение всех исходников для Production.</p>
    </header>

    <section className={styles.section} aria-labelledby="material-title">
      <h2 id="material-title">Нейтральный кадр материала</h2>
      <div className={styles.pair}>
        <figure className={styles.large}>
          <div className={styles.materialFrame}>
            <Image src="https://static.tildacdn.com/stor6630-3961-4934-b335-356663613332/43800746.png" width={656} height={656}
              sizes="(max-width: 700px) calc(100vw - 40px), 600px" preload
              alt="Товарное изображение «Азур»" />
          </div>
          <figcaption>MF-MAR-0086 · Азур · product_primary · 656 × 656 source. Сверьте чёткость, края и цвет без тонирования.</figcaption>
        </figure>
        <figure className={styles.card}>
          <div className={styles.cardFrame}>
            <Image src="https://static.tildacdn.com/stor6630-3961-4934-b335-356663613332/43800746.png" width={656} height={656}
              sizes="(max-width: 700px) calc(100vw - 40px), (max-width: 1100px) 35vw, 360px"
              alt="Товарное изображение «Азур»" loading="lazy" />
          </div>
          <figcaption>Карточка · тот же product_primary и тот же SKU. Отдельного товара не создаётся.</figcaption>
        </figure>
      </div>
    </section>

    <section className={styles.section} aria-labelledby="detail-title">
      <h2 id="detail-title">Дополнительный кадр</h2>
      <figure className={styles.detail}>
        <Image src="https://static.tildacdn.com/stor6563-3966-4530-b565-383034623936/34557235.jpg" width={1680} height={840}
          sizes="(max-width: 700px) calc(100vw - 40px), (max-width: 1440px) 75vw, 1100px"
          alt="Деталь товара «Азур»" loading="lazy" />
        <figcaption>MF-MAR-0086 · product_detail. Цифры и деление на исходном кадре присутствуют в самом источнике.</figcaption>
      </figure>
    </section>

    <section className={styles.section} aria-labelledby="interior-title">
      <h2 id="interior-title">Пример применения</h2>
      <figure className={styles.interior}>
        <Image src="https://static.tildacdn.com/tild6165-3361-4466-a636-356135656166/bleu-fleuri-v-intere.jpg" width={768} height={768}
          sizes="(max-width: 700px) calc(100vw - 40px), 600px"
          alt="«Доминикана» в интерьере" loading="lazy" />
        <figcaption>MF-MAR-0016 · interior_application. Происхождение интерьера как проекта Marmix Flex не заявляется.</figcaption>
      </figure>
    </section>
    <p className={styles.note}>Права на эти источники подтверждены владельцем в T010. Их качество для Production по-прежнему требует отдельного решения владельца.</p>
  </main>;
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EditorialContact } from "../EditorialContact";
import styles from "../information.module.css";

export const metadata: Metadata = { title: "Доставка и самовывоз — Marmix Flex" };

export default function DeliveryPage() {
  return (
    <div className={styles.page}>
      <header className={`${styles.hero} ${styles.deliveryHero}`}>
        <div>
          <p className={styles.eyebrow}>Marmix Flex / Получение материала</p>
          <h1>Доставка<br />и самовывоз</h1>
          <p className={styles.deliveryLead}>Доставка и самовывоз доступны. Детальные условия согласовываются с менеджером после рассмотрения заявки.</p>
        </div>
        <figure className={styles.heroVisual}>
          <div className={styles.heroImage}>
            <Image src="/images/editorial/scene-slate-wall.webp" alt="Визуализация архитектурного пространства с графитовой фактурной плоскостью" fill priority sizes="(max-width: 800px) 100vw, 43vw" />
          </div>
          <figcaption>Архитектурная визуализация · не реальный объект и не SKU</figcaption>
        </figure>
      </header>

      <section className={styles.deliveryOptions} aria-labelledby="getting-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>01 / Получение</p>
          <h2 id="getting-title">Как происходит получение</h2>
          <p>Способ и условия получения уточняются для конкретной заявки до подтверждения заказа.</p>
        </div>
        <div className={styles.optionGrid}>
          <div className={styles.option}><span>01 / Доставка</span><h3>Доставка</h3><p>Доставка доступна. Стоимость, способ и условия получения уточняются с менеджером после рассмотрения заявки.</p></div>
          <div className={styles.option}><span>02 / Самовывоз</span><h3>Самовывоз</h3><p>Самовывоз доступен. Место и порядок получения согласовываются с менеджером. Контактные адреса не обозначают подтверждённые точки самовывоза.</p></div>
        </div>
      </section>

      <section className={styles.clarification} aria-labelledby="clarification-title">
        <div className={styles.clarificationHeading}>
          <p className={styles.eyebrow}>02 / После заявки</p>
          <h2 id="clarification-title">Что уточняет менеджер</h2>
        </div>
        <div className={styles.clarificationCopy}>
          <p>После рассмотрения заявки менеджер связывается с вами, чтобы обсудить материал, способ получения и условия для вашей заявки.</p>
          <p>Условия оплаты согласовываются с менеджером после рассмотрения заявки.</p>
          <p className={styles.requestNote}>Заявка — это запрос на расчёт и связь с менеджером. Она не резервирует товар и сама по себе не является подтверждённым заказом или оплатой.</p>
        </div>
      </section>

      <section className={styles.deliveryNext} aria-labelledby="delivery-next-title">
        <div>
          <p className={styles.eyebrow}>Начать выбор</p>
          <h2 id="delivery-next-title">Выберите материал<br />в каталоге</h2>
          <p>Изображения и заполненные сведения о товарах доступны на страницах каталога.</p>
        </div>
        <Link className={styles.primaryAction} href="/catalog">Перейти в каталог <span aria-hidden="true">↗</span></Link>
      </section>
      <EditorialContact id="delivery-contacts-title" />
    </div>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EditorialContact } from "../EditorialContact";
import styles from "../information.module.css";

export const metadata: Metadata = { title: "Доставка и самовывоз — Marmix Flex" };

const steps = [
  ["01", "Вы выбираете материалы", "Добавьте нужные позиции в корзину и укажите количество."],
  ["02", "Отправляете заявку", "Перед отправкой сервер повторно проверяет актуальные данные товаров. Заявка передаёт менеджеру состав выбранных позиций и ваши контактные данные."],
  ["03", "Согласовываются условия", "Менеджер связывается с вами и уточняет способ получения, стоимость и условия оплаты."],
  ["04", "Согласовывается получение", "После уточнения деталей согласовывается дальнейший порядок получения товара."],
] as const;

const questions = [
  ["Есть ли доставка?", "Да. Детальные условия согласовываются с менеджером."],
  ["Есть ли самовывоз?", "Да. Точка и порядок получения уточняются при согласовании заявки."],
  ["Сколько стоит доставка?", "Стоимость зависит от условий конкретной заявки и уточняется менеджером."],
  ["Как происходит оплата?", "Условия оплаты согласовываются после рассмотрения заявки."],
  ["Отправка заявки означает, что заказ подтверждён?", "Нет. Заявка является запросом на расчёт и связь с менеджером."],
] as const;

export default function DeliveryPage() {
  return (
    <div className={styles.page}>
      <header className={`${styles.hero} ${styles.deliveryHero}`}>
        <div>
          <p className={styles.eyebrow}>Marmix Flex / Получение материала</p>
          <h1>Доставка<br />и самовывоз</h1>
          <p className={styles.deliveryLead}>Доставка и самовывоз доступны. Способ получения, стоимость и другие детали согласовываются с менеджером после рассмотрения заявки.</p>
          <p className={styles.deliveryAside}>Мы фиксируем состав заявки, после чего менеджер помогает согласовать дальнейшие условия получения товара.</p>
        </div>
        <figure className={styles.heroVisual}>
          <div className={styles.heroImage}>
            <Image src="/images/editorial/scene-slate-wall.webp" alt="Визуализация архитектурного пространства с графитовой фактурной плоскостью" fill priority sizes="(max-width: 800px) 100vw, 43vw" />
          </div>
          <figcaption>Архитектурная визуализация · не реальный объект и не SKU</figcaption>
        </figure>
      </header>

      <section className={styles.deliveryProcess} aria-labelledby="getting-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>01 / Путь заявки</p>
          <h2 id="getting-title">Как происходит получение</h2>
          <p>От выбора материала до согласования дальнейших условий — четыре шага.</p>
        </div>
        <ol className={styles.processList}>
          {steps.map(([number, title, copy]) => (
            <li key={number}><span className={styles.processNumber}>{number}</span><h3>{title}</h3><p>{copy}</p></li>
          ))}
        </ol>
      </section>

      <section className={styles.deliveryOptions} aria-labelledby="options-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>02 / Способы получения</p>
          <h2 id="options-title">Два варианта получения</h2>
          <p>Способ и условия получения обсуждаются для конкретной заявки до подтверждения заказа.</p>
        </div>
        <div className={styles.optionGrid}>
          <div className={styles.option}>
            <span>01 / Доставка</span><h3>Доставка</h3>
            <p>Доставка доступна. Конкретные условия зависят от заявки и согласовываются с менеджером.</p>
            <p className={styles.optionLabel}>Уточняется перед подтверждением:</p>
            <ul><li>способ доставки;</li><li>стоимость;</li><li>условия получения.</li></ul>
          </div>
          <div className={styles.option}>
            <span>02 / Самовывоз</span><h3>Самовывоз</h3>
            <p>Самовывоз доступен. Точка и порядок получения подтверждаются менеджером при согласовании заявки.</p>
            <p className={styles.optionNote}>Адреса на странице контактов — контактные адреса Marmix Flex. Они не обозначены как подтверждённые точки самовывоза.</p>
          </div>
        </div>
      </section>

      <section className={styles.clarification} aria-labelledby="clarification-title">
        <div>
          <p className={styles.eyebrow}>03 / После заявки</p>
          <h2 id="clarification-title">Что уточняет менеджер</h2>
          <p className={styles.clarificationIntro}>Детали согласовываются для выбранных материалов и способа получения.</p>
        </div>
        <ul className={styles.clarificationList}>
          <li>Состав заявки и количество выбранных материалов</li>
          <li>Способ получения</li>
          <li>Стоимость доставки, если применяется</li>
          <li>Условия оплаты</li>
          <li>Дальнейший порядок получения</li>
        </ul>
      </section>

      <section className={styles.paymentSection} aria-labelledby="payment-title">
        <div><p className={styles.eyebrow}>04 / Оплата</p><h2 id="payment-title">Оплата после согласования</h2></div>
        <p>Условия оплаты согласовываются с менеджером после рассмотрения заявки. Онлайн-оплата на сайте сейчас не используется.</p>
      </section>

      <aside className={styles.requestSection} aria-labelledby="request-title">
        <p className={styles.eyebrow}>Важно о заявке</p>
        <h2 id="request-title">Запрос на расчёт, а не подтверждение заказа</h2>
        <p>Заявка — это запрос на расчёт и связь с менеджером. Она не резервирует товар и сама по себе не является подтверждённым заказом или оплатой.</p>
      </aside>

      <section className={styles.faqSection} aria-labelledby="faq-title">
        <div><p className={styles.eyebrow}>05 / Ответы</p><h2 id="faq-title">Частые вопросы</h2></div>
        <dl className={styles.faqList}>
          {questions.map(([question, answer]) => <div key={question}><dt>{question}</dt><dd>{answer}</dd></div>)}
        </dl>
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

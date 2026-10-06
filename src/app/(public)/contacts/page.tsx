import type { Metadata } from "next";
import Link from "next/link";
import { addressMapUrl, contactLocations, contactPhone } from "../contact-data";
import styles from "../information.module.css";

export const metadata: Metadata = { title: "Контакты — Marmix Flex" };

export default function ContactsPage() {
  return (
    <div className={styles.page}>
      <header className={`${styles.hero} ${styles.contactHero}`}>
        <div>
          <p className={styles.eyebrow}>Marmix Flex / Связь</p>
          <h1>Контакты</h1>
        </div>
        <div className={styles.heroAside}>
          <p>Marmix Flex представлен в Сургуте и Москве. Чтобы обсудить материал или заявку, позвоните нам.</p>
          <a className={styles.heroPhone} href={contactPhone.href}>{contactPhone.label}</a>
        </div>
      </header>

      <section className={styles.locations} aria-labelledby="locations-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Два города / Подтверждённые адреса</p>
          <h2 id="locations-title">Где мы представлены</h2>
          <p>Выберите адрес, чтобы открыть его поиском в картах. Если планируете визит, предварительно уточните детали по телефону.</p>
        </div>
        <div className={styles.locationGrid}>
          {contactLocations.map(({ city, address }, index) => (
            <article className={styles.location} key={city}>
              <div className={styles.locationTop}>
                <span>0{index + 1} / Адрес</span>
                <span>Marmix Flex</span>
              </div>
              <div className={styles.locationDetails}>
                <h3>{city}</h3>
                <address>{address}</address>
                <a href={addressMapUrl(address)} target="_blank" rel="noopener noreferrer" aria-label={`Открыть адрес в ${city} на карте (новая вкладка)`}>
                  Открыть на карте <span aria-hidden="true">↗</span>
                </a>
              </div>
              <span className={styles.locationFoot}>Адресный поиск / без вручную заданной отметки</span>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.contactNext} aria-labelledby="contact-next-title">
        <div>
          <p className={styles.eyebrow}>Следующий шаг</p>
          <h2 id="contact-next-title">Начните с материала</h2>
          <p>В каталоге можно посмотреть опубликованные товары, изображения и заполненные характеристики. Заявка помогает запросить расчёт и связаться с менеджером.</p>
        </div>
        <div className={styles.actions}>
          <Link className={styles.primaryAction} href="/catalog">Перейти в каталог <span aria-hidden="true">↗</span></Link>
          <a className={styles.textAction} href={contactPhone.href}>Позвонить <span aria-hidden="true">↗</span></a>
        </div>
      </section>
    </div>
  );
}

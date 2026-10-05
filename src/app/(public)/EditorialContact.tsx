import styles from "./editorial.module.css";

export function EditorialContact({ id }: { id: string }) {
  return (
    <section className={styles.contactSection} aria-labelledby={id}>
      <div className={styles.contactMap} role="img" aria-label="Географическая схема присутствия: Москва и Сургут, без адресных отметок">
        <span className={styles.mapEyebrow}>География присутствия / без адресных отметок</span>
        <div className={styles.mapTrack} aria-hidden="true">
          <span className={styles.mapCity}>Москва</span>
          <span className={styles.mapLine} />
          <span className={styles.mapCity}>Сургут</span>
        </div>
        <span className={styles.mapFoot}>Два города · точные адреса не опубликованы</span>
      </div>
      <div className={styles.contactCopy}>
        <p className={styles.eyebrow}>Связаться / Marmix Flex</p>
        <h2 id={id}>Контакты</h2>
        <p>Marmix Flex представлен в Сургуте и Москве. Чтобы обсудить материал или заявку, позвоните по одному из подтверждённых номеров.</p>
        <div className={styles.contactPhones}>
          <a href="tel:+73462999676">+7 (346) 299-96-76</a>
          <a href="tel:+79825199676">+7 (982) 519-96-76</a>
        </div>
        <a className={styles.contactAction} href="tel:+73462999676">Позвонить <span aria-hidden="true">↗</span></a>
      </div>
    </section>
  );
}

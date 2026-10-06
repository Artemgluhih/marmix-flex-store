import styles from "./editorial.module.css";

export function EditorialContact({ id }: { id: string }) {
  return (
    <section className={styles.contactSection} aria-labelledby={id}>
      <div className={styles.contactMap} aria-label="География присутствия: Москва и Сургут">
        <span className={styles.mapEyebrow}>География присутствия / два города</span>
        <div className={styles.mapTrack} aria-hidden="true">
          <span className={styles.mapCity}>Москва</span>
          <span className={styles.mapLine} />
          <span className={styles.mapCity}>Сургут</span>
        </div>
        <span className={styles.mapFoot}>Адреса и телефон указаны рядом</span>
      </div>
      <div className={styles.contactCopy}>
        <p className={styles.eyebrow}>Связаться / Marmix Flex</p>
        <h2 id={id}>Контакты</h2>
        <p>Marmix Flex представлен в Сургуте и Москве. Чтобы обсудить материал или заявку, позвоните нам.</p>
        <address className={styles.contactAddresses}>
          <div><span>Сургут</span><p>г. Сургут, Декабристов 1А</p></div>
          <div><span>Москва</span><p>г. Москва, Товарищеский переулок, 13, Офис 4</p></div>
        </address>
        <div className={styles.contactPhones}>
          <a href="tel:+73462999676">+7 (346) 299-96-76</a>
        </div>
        <a className={styles.contactAction} href="tel:+73462999676">Позвонить <span aria-hidden="true">↗</span></a>
      </div>
    </section>
  );
}

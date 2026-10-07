import styles from "./editorial.module.css";
import { contactLocations, contactPhone } from "./contact-data";
import { TrackedPhoneLink } from "@/lib/analytics/TrackedLinks";

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
          {contactLocations.map(({ city, address }) => (
            <div key={city}><span>{city}</span><p>{address}</p></div>
          ))}
        </address>
        <div className={styles.contactPhones}>
          <TrackedPhoneLink href={contactPhone.href}>{contactPhone.label}</TrackedPhoneLink>
        </div>
        <TrackedPhoneLink className={styles.contactAction} href={contactPhone.href}>Позвонить <span aria-hidden="true">↗</span></TrackedPhoneLink>
      </div>
    </section>
  );
}

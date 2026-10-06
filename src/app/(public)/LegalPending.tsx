import Link from "next/link";
import styles from "./legal.module.css";

type Props = {
  eyebrow: string;
  title: string;
  status: string;
  explanation: string;
  items: readonly string[];
  note?: string;
  otherHref: "/privacy" | "/terms";
  otherLabel: string;
};

export function LegalPending({ eyebrow, title, status, explanation, items, note, otherHref, otherLabel }: Props) {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1>{title}</h1>
        <div className={styles.status} role="status">
          <span className={styles.statusNumber} aria-hidden="true">01 /</span>
          <div>
            <p className={styles.statusLabel}>Pending owner/legal approval</p>
            <p className={styles.statusText}>{status}</p>
          </div>
        </div>
      </header>

      <section className={styles.body} aria-labelledby="pending-title">
        <div>
          <p className={styles.eyebrow}>Текущий статус</p>
          <h2 id="pending-title">Редакция ещё не утверждена</h2>
        </div>
        <div className={styles.bodyCopy}>
          <p>{explanation}</p>
          {note && <p className={styles.confirmed}>{note}</p>}
        </div>
      </section>

      <section className={styles.pending} aria-labelledby="confirmation-title">
        <div>
          <p className={styles.eyebrow}>До публикации документа</p>
          <h2 id="confirmation-title">Что требует согласования</h2>
        </div>
        <ol>
          {items.map((item, index) => (
            <li key={item}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{item}</li>
          ))}
        </ol>
      </section>

      <nav className={styles.next} aria-label="Другие страницы">
        <p>Обычные контакты Marmix Flex доступны отдельно. Они не обозначены как юридические контакты продавца или оператора персональных данных.</p>
        <div>
          <Link href={otherHref}>{otherLabel}<span aria-hidden="true">↗</span></Link>
          <Link href="/contacts">Контакты Marmix Flex<span aria-hidden="true">↗</span></Link>
        </div>
      </nav>
    </div>
  );
}

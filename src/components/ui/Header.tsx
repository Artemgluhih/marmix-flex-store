import Link from "next/link";
import { Navigation } from "./Navigation";
import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" id="public-brand" aria-label="Marmix Flex — на главную">
        <span className={styles.brandName}>MARMIX FLEX</span>
        <span className={styles.brandCaption}>архитектурные поверхности</span>
      </Link>
      <Navigation />
      <div className={styles.end}>
        <span className={styles.location}>Сургут</span>
        <Link className={styles.contact} href="/contacts">
          Обсудить проект <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </header>
  );
}

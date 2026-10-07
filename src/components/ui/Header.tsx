import Link from "next/link";
import { Navigation } from "./Navigation";
import { CartStatus } from "./CartStatus";
import { TrackedContactLink } from "@/lib/analytics/TrackedLinks";
import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" id="public-brand" aria-label="Marmix Flex — на главную">
        <span className={styles.brandName}>MARMIX FLEX</span>
        <span className={styles.brandCaption}>архитектурные поверхности</span>
      </Link>
      <Navigation />
      <CartStatus />
      <div className={styles.end}>
        <span className={styles.location}>Сургут</span>
        <TrackedContactLink className={styles.contact}>
          Обсудить проект <span aria-hidden="true">↗</span>
        </TrackedContactLink>
      </div>
    </header>
  );
}

import Link from "next/link";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer} id="public-footer">
      <div className={styles.identity}>
        <span className={styles.name}>MARMIX FLEX</span>
        <span className={styles.caption}>архитектурные поверхности</span>
      </div>
      <nav className={styles.navigation} aria-label="Навигация внизу страницы">
        <Link href="/catalog">Каталог</Link>
        <Link href="/applications">Применение</Link>
        <Link href="/about">О компании</Link>
        <Link href="/delivery">Доставка</Link>
        <Link href="/contacts">Контакты</Link>
      </nav>
      <a className={styles.top} href="#top">Наверх ↑</a>
    </footer>
  );
}

import Link from "next/link";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer} id="public-footer">
      <div className={styles.identity}>
        <span className={styles.name}>MARMIX FLEX</span>
        <span className={styles.caption}>архитектурные поверхности</span>
      </div>
      <div className={styles.linkGroups}>
        <nav className={styles.navigation} aria-label="Навигация внизу страницы">
          <Link href="/catalog">Каталог</Link>
          <Link href="/applications">Применение</Link>
          <Link href="/about">О бренде</Link>
          <Link href="/delivery">Доставка</Link>
          <Link href="/contacts">Контакты</Link>
        </nav>
        <nav className={styles.legalNavigation} aria-label="Юридические страницы">
          <Link href="/privacy">Политика конфиденциальности</Link>
          <Link href="/terms">Условия использования</Link>
        </nav>
      </div>
      <a className={styles.top} href="#top">Наверх ↑</a>
    </footer>
  );
}

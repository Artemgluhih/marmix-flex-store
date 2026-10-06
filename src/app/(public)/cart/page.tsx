import Link from "next/link";
import { createPrivateMetadata } from "@/lib/seo/metadata";
import { CartPageClient } from "./CartPageClient";
import styles from "./cart.module.css";

export const metadata = createPrivateMetadata("Корзина", "Выбранные позиции и количество в корзине Marmix Flex.");

export default function CartPage() {
  return <section className={styles.page} aria-labelledby="cart-title">
    <nav className={styles.breadcrumb} aria-label="Навигационная цепочка">
      <Link href="/">Главная</Link><span aria-hidden="true">→</span><span aria-current="page">Корзина</span>
    </nav>
    <header className={styles.intro}><p className={styles.eyebrow}>Ваш выбор</p><h1 id="cart-title">Корзина</h1></header>
    <CartPageClient />
  </section>;
}

import Link from "next/link";
import type { Metadata } from "next";
import { CheckoutPageClient } from "./CheckoutPageClient";
import styles from "./checkout.module.css";

export const metadata: Metadata = { title: "Заявка — Marmix Flex", robots: { index: false, follow: false } };

export default function CheckoutPage() {
  return <section className={styles.page} aria-labelledby="checkout-title">
    <nav className={styles.breadcrumb} aria-label="Навигационная цепочка">
      <Link href="/">Главная</Link><span aria-hidden="true">→</span>
      <Link href="/cart">Корзина</Link><span aria-hidden="true">→</span><span aria-current="page">Заявка</span>
    </nav>
    <header className={styles.intro}><p className={styles.eyebrow}>Ваш выбор</p><h1 id="checkout-title">Заявка</h1></header>
    <CheckoutPageClient />
  </section>;
}

import type { ReactNode } from "react";
import { Footer } from "@/components/ui/Footer";
import { Header } from "@/components/ui/Header";
import { CartProvider } from "@/lib/cart/CartProvider";
import { MetrikaPageviews } from "@/lib/analytics/MetrikaPageviews";
import { productionCounterId } from "@/lib/analytics/metrika";
import styles from "./layout.module.css";

export default function PublicLayout({ children }: { children: ReactNode }) {
  const counterId = productionCounterId(process.env.VERCEL_ENV, process.env.YANDEX_METRIKA_ID);
  return (
    <CartProvider><div className={styles.shell} id="top">
      {counterId !== null && <MetrikaPageviews counterId={counterId} />}
      <a className={styles.skip} href="#public-main">К содержимому</a>
      <Header />
      <main id="public-main" className={styles.main}>
        {children}
      </main>
      <Footer />
    </div></CartProvider>
  );
}

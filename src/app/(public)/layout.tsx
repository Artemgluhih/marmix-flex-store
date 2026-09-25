import type { ReactNode } from "react";
import { Footer } from "@/components/ui/Footer";
import { Header } from "@/components/ui/Header";
import styles from "./layout.module.css";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell} id="top">
      <a className={styles.skip} href="#public-main">К содержимому</a>
      <Header />
      <main id="public-main" className={styles.main}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

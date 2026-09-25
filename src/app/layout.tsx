import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Manrope, Prata } from "next/font/google";
import "./tokens.css";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-manrope",
});

const prata = Prata({
  subsets: ["latin", "cyrillic"],
  weight: "400",
  display: "swap",
  variable: "--font-prata",
});

// This is a temporary foundation page, not the public site.
// SEO metadata and indexing rules for the completed site are handled later.
export const metadata: Metadata = {
  title: "Marmix Flex — проверка дизайн-системы",
  description: "Проверочная страница визуальной основы Marmix Flex Redesign v2.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${manrope.variable} ${prata.variable}`}>
      <body>{children}</body>
    </html>
  );
}

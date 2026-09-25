import type { ReactNode } from "react";
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${manrope.variable} ${prata.variable}`}>
      <body>{children}</body>
    </html>
  );
}

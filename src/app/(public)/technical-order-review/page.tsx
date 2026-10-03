import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReviewClient } from "./ReviewClient";
import { getSecretSupabaseConfig } from "@/lib/supabase/env";
import styles from "../checkout/checkout.module.css";

export const metadata: Metadata = { title: "TECHNICAL ORDER SUBMISSION REVIEW — TEST_ONLY", robots: { index: false, follow: false } };

export default function TechnicalOrderReview() {
  if (process.env.VERCEL_ENV !== "preview") notFound();
  let privateConfigReady = true;
  try { getSecretSupabaseConfig(); } catch { privateConfigReady = false; }
  return <section className={styles.page}>
    <header className={styles.intro}>
      <p className={styles.eyebrow}>Preview · TEST_ONLY</p>
      <h1>TECHNICAL ORDER SUBMISSION REVIEW — TEST_ONLY</h1>
    </header>
    {!privateConfigReady && <p role="alert">Private order configuration is unavailable on this review deployment. No submission can be made.</p>}
    <ReviewClient />
  </section>;
}

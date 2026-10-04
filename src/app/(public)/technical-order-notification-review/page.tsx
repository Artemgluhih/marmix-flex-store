import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { missingPreviewNotificationEnvNames } from "@/lib/orders/notifications";
import { ReviewClient } from "./ReviewClient";
import styles from "../checkout/checkout.module.css";

export const metadata: Metadata = {
  title: "TECHNICAL ORDER NOTIFICATION REVIEW — TEST_ONLY",
  robots: { index: false, follow: false },
};

export default function TechnicalOrderNotificationReview() {
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.VERCEL_GIT_COMMIT_REF !== "t054a-preview-review") notFound();
  const ready = missingPreviewNotificationEnvNames().length === 0;
  return <section className={styles.page}>
    <header className={styles.intro}>
      <p className={styles.eyebrow}>Preview · TEST_ONLY</p>
      <h1>TECHNICAL ORDER NOTIFICATION REVIEW — TEST_ONLY</h1>
    </header>
    {ready ? <ReviewClient /> : <p role="alert">Preview notification configuration is unavailable.</p>}
  </section>;
}

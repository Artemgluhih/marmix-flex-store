import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedProduct } from "@/lib/catalog/queries";
import { ReviewClient } from "./ReviewClient";
import styles from "../checkout/checkout.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "TECHNICAL ORDER FLOW REVIEW — TEST_ONLY",
  robots: { index: false, follow: false },
};

export default async function TechnicalOrderFlowReview() {
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.VERCEL_GIT_COMMIT_REF !== "t055-preview-review") notFound();
  const azur = await getPublishedProduct("azur");
  return <section className={styles.page}>
    <header className={styles.intro}>
      <p className={styles.eyebrow}>Preview · isolated TEST_ONLY</p>
      <h1>TECHNICAL ORDER FLOW REVIEW — TEST_ONLY</h1>
      <p className={styles.formLead}>Технический товар существует только в этом сценарии. Он не опубликован в каталоге и не создаёт строку products. Контакты для отправки фиксированы и синтетические.</p>
    </header>
    <ReviewClient azurId={azur?.id ?? null} />
  </section>;
}

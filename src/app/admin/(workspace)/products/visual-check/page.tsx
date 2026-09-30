import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/admin/require-admin";
import { AssortmentControls } from "../[id]/AssortmentControls";
import base from "../new/new-product.module.css";
import styles from "../[id]/edit-product.module.css";

export const metadata: Metadata = { title: "TEST_ONLY — состояния товара", robots: { index: false, follow: false } };

export default async function StateVisualCheck({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  if (process.env.VERCEL_ENV !== "preview") notFound();
  await requireAdmin("/admin/products/visual-check");
  const view = (await searchParams).view;
  const archived = view === "archived";
  const published = view === "published" && !archived;
  return <div className={base.page}>
    <p className={base.eyebrow}>Рабочее пространство / Каталог</p>
    <h1>Редактирование товара</h1>
    <p className={base.intro}>TEST_ONLY Preview: визуальный образец без записи в БД. Все действия сохранения отключены.</p>
    <p className={styles.fixture}>Состояние: <Link href="/admin/products/visual-check">Скрыт</Link> · <Link href="/admin/products/visual-check?view=published">Опубликован</Link> · <Link href="/admin/products/visual-check?view=archived">В архиве</Link></p>
    <section className={styles.identity} aria-label="Образец товара"><div><span>Название</span><strong>TEST_ONLY — визуальный образец</strong></div><div><span>SKU</span><strong>TEST_ONLY</strong></div></section>
    <AssortmentControls product={{ id: "TEST_ONLY-visual", is_published: published, archived_at: archived ? "preview" : null, availability_status: "on_order", is_featured: true, sort_order: 12 }} previewOnly />
  </div>;
}

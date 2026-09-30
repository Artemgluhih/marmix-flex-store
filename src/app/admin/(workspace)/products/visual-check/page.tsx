import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/admin/require-admin";
import { EditProductForm } from "../[id]/EditProductForm";
import { MAX_SPECS, type EditValues } from "../[id]/edit-validation";
import base from "../new/new-product.module.css";
import styles from "../[id]/edit-product.module.css";

export const metadata: Metadata = { title: "TEST_ONLY — визуальная проверка редактора", robots: { index: false, follow: false } };

export default async function EditorVisualCheck({ searchParams }: { searchParams: Promise<{ errors?: string }> }) {
  if (process.env.VERCEL_ENV !== "preview") notFound();
  await requireAdmin("/admin/products/visual-check");
  const errors = (await searchParams).errors === "1";
  const values: EditValues = {
    description: "", width_mm: "", height_mm: "", thickness_mm: "", area_per_sale_unit_m2: "",
    seo_title: "", seo_description: "",
    specs: Array.from({ length: MAX_SPECS }, () => ({ key: "", value: "" })),
  };
  return (
    <div className={base.page}>
      <p className={base.eyebrow}>Рабочее пространство / Каталог</p>
      <h1>Редактирование товара</h1>
      <p className={base.intro}>Временный визуальный тест редактора. Данные не загружаются и не сохраняются в базе.</p>
      <p className={styles.fixture}>TEST_ONLY · Preview-only. Сохранение отключено; этот экран будет удалён после проверки владельцем.</p>
      <section className={styles.identity} aria-label="Идентичность тестового товара">
        <div><span>Название</span><strong>TEST_ONLY — образец формы</strong></div>
        <div><span>SKU</span><strong>TEST_ONLY</strong></div>
        <div><span>Адрес</span><strong>preview-only</strong></div>
      </section>
      <p className={styles.fixture}>{errors ? "Показаны примеры сообщений об ошибке." : "Показано обычное состояние формы."} <Link href={errors ? "/admin/products/visual-check" : "/admin/products/visual-check?errors=1"}>Переключить состояние</Link></p>
      <EditProductForm productId="TEST_ONLY-visual" values={values} areaAllowed previewOnly previewErrors={errors} />
    </div>
  );
}

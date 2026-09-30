import type { Metadata } from "next";

import { requireAdmin } from "@/lib/admin/require-admin";
import { CreateProductForm } from "./CreateProductForm";
import styles from "./new-product.module.css";

export const metadata: Metadata = {
  title: "Новый товар — Marmix Flex",
  robots: { index: false, follow: false },
};

export default async function NewProductPage() {
  const { supabase } = await requireAdmin("/admin/products/new");
  const { data, error } = await supabase.from("categories").select("id,name")
    .order("sort_order", { ascending: true }).order("name", { ascending: true });
  if (error || !data) throw new Error("Не удалось загрузить категории для создания товара.");

  return (
    <div className={styles.page}>
      <p className={styles.eyebrow}>Рабочее пространство / Каталог</p>
      <h1>Новый товар</h1>
      <p className={styles.intro}>Создайте черновик SKU. Он будет виден в панели управления и скрыт от посетителей сайта.</p>
      <CreateProductForm categories={data} />
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/admin/require-admin";
import { EditProductForm } from "./EditProductForm";
import { AssortmentControls } from "./AssortmentControls";
import { ProductCategoriesForm } from "./ProductCategoriesForm";
import { MediaUpload } from "./MediaUpload";
import { editValuesFromProduct, validProductId } from "./edit-validation";
import base from "../new/new-product.module.css";
import styles from "./edit-product.module.css";

export const metadata: Metadata = { title: "Редактирование товара — Marmix Flex", robots: { index: false, follow: false } };

export default async function EditProductPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; state?: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin(`/admin/products/${id}`);
  if (!validProductId(id)) notFound();
  const { data: product, error } = await supabase.from("products")
    .select("id,sku,slug,name,series,catalog_kind,is_published,archived_at,availability_status,is_featured,sort_order,description,width_mm,height_mm,thickness_mm,area_per_sale_unit_m2,price_unit,sale_unit,specifications,seo_title,seo_description")
    .eq("id", id).maybeSingle();
  if (error) throw new Error("Не удалось загрузить товар для редактирования.");
  if (!product || (product.catalog_kind !== "REAL" && !(process.env.VERCEL_ENV === "preview" && product.catalog_kind === "TEST_ONLY"))) notFound();
  const [categoryOptions, memberships, imageRows] = await Promise.all([
    supabase.from("categories").select("id,name").order("sort_order").order("name"),
    supabase.from("product_categories").select("category_id").eq("product_id", id),
    supabase.from("product_images").select("id,storage_path,width,height,alt,role,sort_order,is_primary").eq("product_id", id).order("sort_order").order("created_at").order("id"),
  ]);
  if (categoryOptions.error || memberships.error || imageRows.error || !categoryOptions.data || !memberships.data || !imageRows.data) {
    throw new Error("Не удалось загрузить данные товара.");
  }
  const values = editValuesFromProduct(product);
  if (!values) throw new Error("Характеристики товара требуют проверки перед редактированием.");
  const notice = await searchParams;

  return (
    <div className={base.page}>
      <p className={base.eyebrow}>Рабочее пространство / Каталог</p>
      <h1>Редактирование товара</h1>
      <p className={base.intro}>Свойства одного SKU, состояние каталога и изображения товара.</p>
      {product.catalog_kind === "TEST_ONLY" && <p className={styles.fixture}>TEST_ONLY — временный Preview товар. Не относится к реальному каталогу.</p>}
      {(notice.saved === "1" || ["assortment", "publish", "unpublish", "archive", "restore"].includes(notice.state ?? "")) && <p className={styles.success} role="status">Изменения сохранены.</p>}
      <section className={styles.identity} aria-label="Идентичность товара">
        <div><span>Название</span><strong>{product.name}</strong></div>
        <div><span>SKU</span><strong>{product.sku}</strong></div>
        <div><span>Адрес</span><strong>{product.slug}</strong></div>
        {product.series && <div><span>Серия</span><strong>{product.series}</strong></div>}
      </section>
      <AssortmentControls product={product} />
      <ProductCategoriesForm productId={product.id} categories={categoryOptions.data}
        selectedIds={memberships.data.map(({ category_id }) => category_id)} />
      <EditProductForm productId={product.id} values={values} areaAllowed={product.price_unit === "м²" && product.sale_unit === "sheet"} />
      <MediaUpload productId={product.id} productPublished={product.is_published} images={imageRows.data.map((image) => ({
        id: image.id,
        url: supabase.storage.from("product-media").getPublicUrl(image.storage_path).data.publicUrl,
        width: image.width, height: image.height,
        role: image.role, alt: image.alt, sort_order: image.sort_order, is_primary: image.is_primary,
      }))} />
    </div>
  );
}

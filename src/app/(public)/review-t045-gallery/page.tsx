import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedProduct } from "@/lib/catalog/queries";
import { ProductGallery } from "../product/[slug]/ProductGallery";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Technical gallery review", robots: { index: false, follow: false } };

export default async function TechnicalGalleryReview() {
  const [azur, travertin, glue] = await Promise.all([
    getPublishedProduct("azur"),
    getPublishedProduct("travertin-1"),
    getPublishedProduct("klei-dlya-gibkogo-kamnya-bazovii-3-kg"),
  ]);
  if (!azur?.images[0] || !travertin?.images[0] || !glue?.images[0]) notFound();

  // Render-only technical fixture: existing public media, deliberately mixed across products.
  // Its non-first primary checks the gallery's initial selection without inserting DB rows.
  const images = [
    { ...travertin.images[0], isPrimary: false, sortOrder: 1 },
    { ...azur.images[0], isPrimary: true, sortOrder: 2 },
    { ...glue.images[0], isPrimary: false, sortOrder: 3 },
  ];

  return (
    <main style={{ maxWidth: 900, padding: "48px 20px 100px", margin: "auto" }}>
      <h1 style={{ marginBottom: 12 }}>TECHNICAL GALLERY REVIEW — NOT REAL PRODUCT</h1>
      <p style={{ marginBottom: 32 }}>Только проверка навигации: три изображения разных товаров. Это не карточка товара.</p>
      <ProductGallery images={images} />
    </main>
  );
}

import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";
import { MediaUpload, type ImagePreview } from "../products/[id]/MediaUpload";
import base from "../products/new/new-product.module.css";
import styles from "./review.module.css";

export const dynamic = "force-dynamic";

const samples = ["ivory-vein", "graphite-vein", "warm-strata"] as const;

export default async function MediaMetadataReview({ searchParams }: { searchParams: Promise<{ count?: string }> }) {
  if (process.env.VERCEL_ENV !== "preview") notFound();
  await requireAdmin("/admin/media-metadata-review");
  const count = [1, 3, 8].includes(Number((await searchParams).count)) ? Number((await searchParams).count) : 3;
  const images: ImagePreview[] = Array.from({ length: count }, (_, index) => ({
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    url: `/images/showroom/${samples[index % samples.length]}.webp`,
    width: 900, height: 900, role: null, alt: null, sort_order: index, is_primary: index === 1,
  }));
  return <div className={base.page}>
    <p className={base.eyebrow}>Рабочее пространство / Каталог</p>
    <h1>Образец Media Editor</h1>
    <p className={base.intro}>Только визуальная проверка T035. Кадры прототипа не связаны с товаром; изменения не записываются.</p>
    <nav aria-label="Количество изображений для проверки" className={styles.variants}>
      {([1, 3, 8] as const).map((amount) =>
        <a key={amount} href={`/admin/media-metadata-review?count=${amount}`}
          aria-current={amount === count ? "page" : undefined}>
          {amount} {amount === 1 ? "изображение" : "изображений"}
        </a>)}
    </nav>
    <MediaUpload productId="00000000-0000-4000-8000-000000000000" images={images} previewOnly />
  </div>;
}

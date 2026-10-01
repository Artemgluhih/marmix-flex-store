import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";
import { MediaUpload, type ImagePreview } from "../products/[id]/MediaUpload";
import base from "../products/new/new-product.module.css";
import styles from "./review.module.css";

export const dynamic = "force-dynamic";
const samples = ["ivory-vein", "graphite-vein", "warm-strata"] as const;
const cases = ["three", "one", "published", "failure", "eight"] as const;

export default async function MediaRemovalReview({ searchParams }: { searchParams: Promise<{ case?: string }> }) {
  if (process.env.VERCEL_ENV !== "preview") notFound();
  await requireAdmin("/admin/media-removal-review");
  const requested = (await searchParams).case;
  const mode = cases.find((value) => value === requested) ?? "three";
  const count = mode === "one" ? 1 : mode === "eight" ? 8 : 3;
  const images: ImagePreview[] = Array.from({ length: count }, (_, index) => ({
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    url: `/images/showroom/${samples[index % samples.length]}.webp`,
    width: 900, height: 900, role: null, alt: null, sort_order: index, is_primary: index === 0,
  }));
  return <div className={base.page}>
    <p className={base.eyebrow}>Рабочее пространство / Каталог</p>
    <h1>Образец безопасного удаления</h1>
    <p className={base.intro}>Только визуальная проверка T036. Кадры не связаны с товаром; действия не меняют базу или Storage.</p>
    <nav aria-label="Состояния удаления" className={styles.variants}>
      {cases.map((value) => <a key={value} href={`/admin/media-removal-review?case=${value}`}
        aria-current={value === mode ? "page" : undefined}>
        {value === "three" ? "3 изображения" : value === "one" ? "Последнее draft" :
          value === "published" ? "Опубликованный primary" :
            value === "failure" ? "Ошибка Storage / retry" : "8 изображений"}
      </a>)}
    </nav>
    <MediaUpload productId="00000000-0000-4000-8000-000000000000" images={images}
      productPublished={mode === "published"} previewOnly previewFailure={mode === "failure"} />
  </div>;
}

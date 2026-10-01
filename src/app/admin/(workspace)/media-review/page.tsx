import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";
import { MediaUpload } from "../products/[id]/MediaUpload";
import base from "../products/new/new-product.module.css";

export const dynamic = "force-dynamic";

export default async function MediaReview() {
  if (process.env.VERCEL_ENV !== "preview") notFound();
  await requireAdmin("/admin/media-review");
  return <div className={base.page}>
    <p className={base.eyebrow}>Рабочее пространство / Каталог</p>
    <h1>Образец секции изображений</h1>
    <p className={base.intro}>Временная проверка T034: выбор файла и preview без записи данных.</p>
    <MediaUpload productId="123e4567-e89b-42d3-a456-426614174000" previewOnly images={[{
      id: "test-only-visual", width: 1, height: 1,
      url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABpfZFQAAAAABJRU5ErkJggg==",
    }]} />
  </div>;
}

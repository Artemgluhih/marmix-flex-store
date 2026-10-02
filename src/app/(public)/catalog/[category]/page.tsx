import { notFound } from "next/navigation";
import { CategoryCatalog } from "@/components/catalog/CategoryCatalog";
import { listPublishedProducts } from "@/lib/catalog/queries";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const { products, total, category } = await listPublishedProducts({ categorySlug: slug });
  if (!category) notFound();

  return <CategoryCatalog category={category} products={products} total={total} />;
}

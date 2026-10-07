import type { Metadata } from "next";
import { categoryMetadata, type SeoSearchParams } from "@/lib/seo/dynamic";
import { getPublishedSeoCategory } from "@/lib/seo/public-catalog";
import { categoryBreadcrumb } from "@/lib/seo/structured-data";
import { JsonLd } from "@/lib/seo/JsonLd";
import { notFound } from "next/navigation";
import { CategoryCatalog } from "@/components/catalog/CategoryCatalog";
import { getCatalogFacets, listPublishedProducts } from "@/lib/catalog/queries";
import { normalizeCatalogListParams } from "@/lib/catalog/query-params";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: {
  params: Promise<{ category: string }>; searchParams: Promise<SeoSearchParams>;
}): Promise<Metadata> {
  const category = await getPublishedSeoCategory((await params).category);
  if (!category) notFound();
  return categoryMetadata(category, await searchParams);
}

export default async function CategoryPage({ params, searchParams }: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { category: slug } = await params;
  const raw = await searchParams;
  // The path is authoritative; a query category can never replace this scope.
  const input = { categorySlug: slug, q: raw.q, price_min: raw.price_min, price_max: raw.price_max,
    status: raw.status, sort: raw.sort, page: raw.page };
  const [result, facets] = await Promise.all([listPublishedProducts(input), getCatalogFacets()]);
  const { category } = result;
  if (!category) notFound();

  const unfilteredTotal = result.total === 0 ? (await listPublishedProducts({ categorySlug: slug })).total : result.total;
  return <>
    {Object.keys(raw).length === 0 && <JsonLd data={categoryBreadcrumb(category.name, category.slug)} />}
    <CategoryCatalog category={category} result={result} facets={facets}
      params={normalizeCatalogListParams(input)} unfilteredTotal={unfilteredTotal} />
  </>;
}

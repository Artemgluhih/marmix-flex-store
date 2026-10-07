import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/metadata";
import { getPublishedIndexSlugs } from "@/lib/seo/public-catalog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, categories } = await getPublishedIndexSlugs();
  // Preview can verify the production-only URL set; robots never advertises it there.
  const paths = ["/", "/catalog", "/applications", "/about", "/delivery", "/contacts",
    ...categories.map((slug) => `/catalog/${slug}`), ...products.map((slug) => `/product/${slug}`)];
  return paths.map((path) => ({ url: new URL(path, getSiteUrl()).toString() }));
}

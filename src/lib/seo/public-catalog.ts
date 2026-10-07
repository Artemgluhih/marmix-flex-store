import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { normalizeSlug } from "@/lib/catalog/query-params";
import { catalogCacheTags } from "@/lib/catalog/queries";

export type SeoCategory = {
  slug: string; name: string; description: string | null;
  seoTitle: string | null; seoDescription: string | null;
};

export async function getPublishedSeoCategory(input: unknown): Promise<SeoCategory | null> {
  const slug = normalizeSlug(input);
  if (!slug) return null;
  return unstable_cache(async () => {
    const { data, error } = await createPublicSupabaseClient().from("categories")
      .select("slug,name,description,seo_title,seo_description")
      .eq("slug", slug).eq("is_published", true).maybeSingle();
    if (error) throw new Error("Не удалось загрузить опубликованную категорию.");
    return data ? { slug: data.slug, name: data.name, description: data.description,
      seoTitle: data.seo_title, seoDescription: data.seo_description } : null;
  }, ["seo-category", slug], { revalidate: 60,
    tags: [catalogCacheTags.category(slug), catalogCacheTags.facets, catalogCacheTags.list] })();
}

/** Complete guest/RLS slug reads; never limited to one catalog page or Featured. */
export async function getPublishedIndexSlugs(): Promise<{ products: string[]; categories: string[] }> {
  const client = createPublicSupabaseClient({ fresh: true });
  async function read(table: "products" | "categories") {
    const slugs = new Set<string>();
    for (let offset = 0; ; offset += 500) {
      let query = client.from(table).select("id,slug").eq("is_published", true);
      if (table === "products") query = query.eq("catalog_kind", "REAL").is("archived_at", null);
      const { data, error } = await query.order("id", { ascending: true }).range(offset, offset + 499);
      if (error || !data) throw new Error("Не удалось загрузить опубликованные URL.");
      for (const row of data) {
        const slug = normalizeSlug(row.slug);
        if (slug) slugs.add(slug);
      }
      if (data.length < 500) break;
    }
    return [...slugs];
  }
  const [products, categories] = await Promise.all([read("products"), read("categories")]);
  return { products, categories };
}

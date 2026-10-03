import "server-only";

import { unstable_cache } from "next/cache";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { normalizeCatalogListParams, normalizeSlug, PUBLIC_PAGE_SIZE } from "./query-params";
import type { CatalogListInput, CatalogListParams } from "./query-params";
import type { CatalogFacets, PublicCategory, PublicImage, PublicProduct, PublicProductDetail } from "./types";
import { selectRelatedRows } from "./related-selection";
import { normalizeCartIds } from "@/lib/cart/ids";

const TTL_SECONDS = 60;
export const catalogCacheTags = {
  list: "catalog:list",
  facets: "catalog:facets",
  product: (slug: string) => `catalog:product:${slug}`,
  category: (slug: string) => `catalog:category:${slug}`,
} as const;

const PRODUCT_FIELDS = "id,sku,slug,name,series,price_minor,currency,price_unit,sale_unit,min_quantity,quantity_step,area_per_sale_unit_m2,source_price_range,availability_status,is_featured,sort_order";
const DETAIL_FIELDS = `${PRODUCT_FIELDS},description,width_mm,height_mm,thickness_mm,specifications,seo_title,seo_description`;
const CATEGORY_FIELDS = "id,slug,name,sort_order";
const IMAGE_FIELDS = "id,product_id,storage_path,alt,role,width,height,is_primary,sort_order";
type Client = ReturnType<typeof createPublicSupabaseClient>;

function failed(): never {
  throw new Error("Не удалось загрузить публичный каталог.");
}

function categoryDto(row: { id: string; slug: string; name: string; sort_order: number }): PublicCategory {
  return { id: row.id, slug: row.slug, name: row.name, sortOrder: row.sort_order };
}

function relatedCategory(value: unknown): PublicCategory | null {
  if (!value || Array.isArray(value) || typeof value !== "object" || !("id" in value)) return null;
  return categoryDto(value as { id: string; slug: string; name: string; sort_order: number });
}

function imageDto(client: Client, row: {
  storage_path: string; alt: string | null; role: string | null;
  width: number; height: number; is_primary: boolean; sort_order: number;
}): PublicImage {
  return {
    url: client.storage.from("product-media").getPublicUrl(row.storage_path).data.publicUrl,
    alt: row.alt, role: row.role, width: row.width, height: row.height,
    isPrimary: row.is_primary, sortOrder: row.sort_order,
  };
}

async function presentation(client: Client, rows: Array<{ id: string }>, allImages = false): Promise<Map<string, {
  categories: PublicCategory[]; images: PublicImage[];
}>> {
  const result = new Map<string, { categories: PublicCategory[]; images: PublicImage[] }>();
  if (!rows.length) return result;
  const ids = rows.map(({ id }) => id);
  let imageQuery = client.from("product_images").select(IMAGE_FIELDS).in("product_id", ids);
  if (!allImages) imageQuery = imageQuery.eq("is_primary", true);
  const [memberships, images] = await Promise.all([
    client.from("product_categories").select("product_id,categories!inner(id,slug,name,sort_order)")
      .in("product_id", ids).eq("categories.is_published", true),
    imageQuery.order("sort_order", { ascending: true }).order("id", { ascending: true }),
  ]);
  if (memberships.error || images.error || !memberships.data || !images.data) failed();
  for (const { id } of rows) result.set(id, { categories: [], images: [] });
  for (const row of memberships.data) {
    const category = relatedCategory(row.categories);
    if (category) result.get(row.product_id)?.categories.push(category);
  }
  for (const row of images.data) result.get(row.product_id)?.images.push(imageDto(client, row));
  for (const item of result.values()) item.categories.sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  return result;
}

function productDto(row: Record<string, unknown>, related: { categories: PublicCategory[]; images: PublicImage[] }): PublicProduct {
  return {
    id: row.id as string, sku: row.sku as string, slug: row.slug as string, name: row.name as string,
    series: row.series as string | null, priceMinor: row.price_minor as number | null,
    currency: row.currency as string, priceUnit: row.price_unit as string | null,
    saleUnit: row.sale_unit as string | null, minQuantity: row.min_quantity as number | null,
    quantityStep: row.quantity_step as number | null,
    areaPerSaleUnitM2: row.area_per_sale_unit_m2 as number | null,
    sourcePriceRange: row.source_price_range as string | null,
    availabilityStatus: row.availability_status as string | null,
    isFeatured: row.is_featured as boolean, sortOrder: row.sort_order as number,
    categories: related.categories,
    primaryImage: related.images.find((image) => image.isPrimary) ?? null,
  };
}

// One uncached guest/RLS read per distinct product-ID set. Client snapshots never enter this query.
export async function getCartProductsFreshByIds(input: unknown): Promise<PublicProduct[]> {
  const ids = normalizeCartIds(input);
  if (!ids.length) return [];
  const client = createPublicSupabaseClient({ fresh: true });
  const { data, error } = await client.from("products").select(PRODUCT_FIELDS)
    .in("id", ids).eq("catalog_kind", "REAL").eq("is_published", true).is("archived_at", null);
  if (error || !data) failed();
  const related = await presentation(client, data);
  return data.map((row) => productDto(row, related.get(row.id)!));
}

async function publishedCategory(client: Client, slug: string): Promise<PublicCategory | null> {
  const { data, error } = await client.from("categories").select(CATEGORY_FIELDS)
    .eq("slug", slug).eq("is_published", true).maybeSingle();
  if (error) failed();
  return data ? categoryDto(data) : null;
}

async function readList(params: CatalogListParams) {
  const client = createPublicSupabaseClient();
  const category = params.categorySlug ? await publishedCategory(client, params.categorySlug) : null;
  if (params.categorySlug && !category) return { products: [] as PublicProduct[], total: 0, page: params.page, pageSize: PUBLIC_PAGE_SIZE, category: null };

  let ids: string[] | null = null;
  if (category) {
    const membershipIds = new Set<string>();
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await client.from("product_categories").select("product_id")
        .eq("category_id", category.id).order("product_id", { ascending: true }).range(offset, offset + 499);
      if (error || !data) failed();
      for (const { product_id } of data) membershipIds.add(product_id);
      if (data.length < 500) break;
    }
    ids = [...membershipIds];
    if (!ids.length) return { products: [] as PublicProduct[], total: 0, page: params.page, pageSize: PUBLIC_PAGE_SIZE, category };
  }

  if (params.priceMinMinor !== null && params.priceMaxMinor !== null && params.priceMinMinor > params.priceMaxMinor) {
    return { products: [] as PublicProduct[], total: 0, page: params.page, pageSize: PUBLIC_PAGE_SIZE, category };
  }

  // q has a strict alphanumeric/space/hyphen whitelist in query-params; no PostgREST grammar from the URL enters .or().
  const search = params.q ? `name.ilike.%${params.q}%,sku.ilike.%${params.q}%` : null;

  let countQuery = client.from("products").select("id", { count: "exact", head: true })
    .eq("catalog_kind", "REAL").eq("is_published", true).is("archived_at", null);
  if (ids) countQuery = countQuery.in("id", ids);
  if (search) countQuery = countQuery.or(search);
  if (params.priceMinMinor !== null) countQuery = countQuery.gte("price_minor", params.priceMinMinor);
  if (params.priceMaxMinor !== null) countQuery = countQuery.lte("price_minor", params.priceMaxMinor);
  if (params.status) countQuery = countQuery.eq("availability_status", params.status);
  const countResult = await countQuery;
  if (countResult.error || countResult.count === null) failed();
  const total = countResult.count;
  if ((params.page - 1) * PUBLIC_PAGE_SIZE >= total) return {
    products: [] as PublicProduct[], total, page: params.page, pageSize: PUBLIC_PAGE_SIZE, category,
  };

  let query = client.from("products").select(PRODUCT_FIELDS)
    .eq("catalog_kind", "REAL").eq("is_published", true).is("archived_at", null);
  if (ids) query = query.in("id", ids);
  if (search) query = query.or(search);
  if (params.priceMinMinor !== null) query = query.gte("price_minor", params.priceMinMinor);
  if (params.priceMaxMinor !== null) query = query.lte("price_minor", params.priceMaxMinor);
  if (params.status) query = query.eq("availability_status", params.status);
  const ordered = params.sort === "order" ? query.order("sort_order", { ascending: true })
    : query.order("price_minor", { ascending: params.sort === "price_asc", nullsFirst: false });
  const { data, error } = await ordered.order("id", { ascending: true })
    .range((params.page - 1) * PUBLIC_PAGE_SIZE, params.page * PUBLIC_PAGE_SIZE - 1);
  if (error || !data) failed();
  const related = await presentation(client, data);
  return { products: data.map((row) => productDto(row, related.get(row.id)!)), total,
    page: params.page, pageSize: PUBLIC_PAGE_SIZE, category };
}

export async function listPublishedProducts(input: CatalogListInput = {}) {
  const params = normalizeCatalogListParams(input);
  // An explicitly invalid category is never interpreted as System All.
  if (input.categorySlug != null && !params.categorySlug) return {
    products: [] as PublicProduct[], total: 0, page: params.page, pageSize: PUBLIC_PAGE_SIZE, category: null,
  };
  return unstable_cache(() => readList(params), ["catalog-list", JSON.stringify(params)], {
    revalidate: TTL_SECONDS,
    tags: [catalogCacheTags.list, ...(params.categorySlug ? [catalogCacheTags.category(params.categorySlug)] : [])],
  })();
}

async function readFeaturedProducts(): Promise<PublicProduct[]> {
  const client = createPublicSupabaseClient();
  const { data, error } = await client.from("products").select(PRODUCT_FIELDS)
    .eq("catalog_kind", "REAL").eq("is_published", true).is("archived_at", null)
    .eq("is_featured", true).order("sort_order", { ascending: true })
    .order("id", { ascending: true }).limit(3);
  if (error || !data) failed();
  const related = await presentation(client, data);
  return data.map((row) => productDto(row, related.get(row.id)!));
}

export async function listPublishedFeaturedProducts(): Promise<PublicProduct[]> {
  return unstable_cache(readFeaturedProducts, ["catalog-featured"], {
    revalidate: TTL_SECONDS, tags: [catalogCacheTags.list],
  })();
}

async function readProduct(slug: string): Promise<PublicProductDetail | null> {
  const client = createPublicSupabaseClient();
  const { data, error } = await client.from("products").select(DETAIL_FIELDS)
    .eq("slug", slug).eq("catalog_kind", "REAL").eq("is_published", true)
    .is("archived_at", null).maybeSingle();
  if (error) failed();
  if (!data) return null;
  const related = (await presentation(client, [data], true)).get(data.id)!;
  return {
    ...productDto(data, related), description: data.description,
    widthMm: data.width_mm, heightMm: data.height_mm, thicknessMm: data.thickness_mm,
    specifications: data.specifications as Record<string, unknown>,
    seoTitle: data.seo_title, seoDescription: data.seo_description,
    images: related.images,
  };
}

export async function getPublishedProduct(slug: unknown): Promise<PublicProductDetail | null> {
  const normalized = normalizeSlug(slug);
  if (!normalized) return null;
  return unstable_cache(() => readProduct(normalized), ["catalog-product", normalized], {
    revalidate: TTL_SECONDS, tags: [catalogCacheTags.product(normalized)],
  })();
}

async function readRelatedProducts(product: PublicProductDetail): Promise<PublicProduct[]> {
  const client = createPublicSupabaseClient();
  const seriesRows = product.series ? await client.from("products").select(PRODUCT_FIELDS)
    .eq("series", product.series).neq("id", product.id)
    .eq("catalog_kind", "REAL").eq("is_published", true).is("archived_at", null)
    .order("sort_order", { ascending: true }).order("id", { ascending: true }).limit(3)
    : { data: [] as Array<{ id: string } & Record<string, unknown>>, error: null };
  if (seriesRows.error || !seriesRows.data) failed();
  let categoryRows: Array<{ id: string } & Record<string, unknown>> = [];

  // Product categories come from the guest read; explicitly constrain the joined categories too.
  if (seriesRows.data.length < 3 && product.categories.length) {
    const categoryIds = product.categories.map(({ id }) => id);
    const membershipIds = new Set<string>();
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await client.from("product_categories")
        .select("product_id,categories!inner(id)")
        .in("category_id", categoryIds).eq("categories.is_published", true)
        .neq("product_id", product.id)
        .order("product_id", { ascending: true }).range(offset, offset + 499);
      if (error || !data) failed();
      for (const row of data) membershipIds.add(row.product_id);
      if (data.length < 500) break;
    }
    if (membershipIds.size) {
      const { data, error } = await client.from("products").select(PRODUCT_FIELDS)
        .in("id", [...membershipIds]).neq("id", product.id)
        .eq("catalog_kind", "REAL").eq("is_published", true).is("archived_at", null)
        .order("sort_order", { ascending: true }).order("id", { ascending: true })
        .limit(3 + seriesRows.data.length);
      if (error || !data) failed();
      categoryRows = data;
    }
  }
  const rows = selectRelatedRows<{ id: string } & Record<string, unknown>>(product.id, seriesRows.data, categoryRows);
  const related = await presentation(client, rows as Array<{ id: string }>);
  return rows.map((row) => productDto(row, related.get(row.id as string)!));
}

export async function getRelatedProducts(product: PublicProductDetail): Promise<PublicProduct[]> {
  if (!product.series && product.categories.length === 0) return [];
  return unstable_cache(() => readRelatedProducts(product), ["catalog-related", product.id], {
    revalidate: TTL_SECONDS, tags: [catalogCacheTags.list, catalogCacheTags.product(product.slug)],
  })();
}

async function readFacets(): Promise<CatalogFacets> {
  const client = createPublicSupabaseClient();
  const prices: number[] = [];
  const availability = new Set<string>();
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from("products").select("id,price_minor,availability_status")
      .eq("catalog_kind", "REAL").eq("is_published", true).is("archived_at", null)
      .order("id", { ascending: true }).range(offset, offset + 499);
    if (error || !data) failed();
    for (const row of data) {
      if (row.price_minor !== null) prices.push(row.price_minor);
      if (row.availability_status !== null) availability.add(row.availability_status);
    }
    if (data.length < 500) break;
  }
  const categories = new Map<string, PublicCategory>();
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from("product_categories")
      .select("categories!inner(id,slug,name,sort_order)")
      .order("product_id", { ascending: true }).order("category_id", { ascending: true })
      .range(offset, offset + 499);
    if (error || !data) failed();
    for (const row of data) {
      const category = relatedCategory(row.categories);
      if (category) categories.set(category.id, category);
    }
    if (data.length < 500) break;
  }
  return {
    categories: [...categories.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)),
    fixedPriceMinor: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
    availabilityStatuses: [...availability].sort(),
  };
}

export async function getCatalogFacets(): Promise<CatalogFacets> {
  return unstable_cache(readFacets, ["catalog-facets"], {
    revalidate: TTL_SECONDS, tags: [catalogCacheTags.facets, catalogCacheTags.list],
  })();
}

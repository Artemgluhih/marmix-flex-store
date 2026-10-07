import "server-only";

import type { AdminContext } from "@/lib/admin/require-admin";

export type ProductListRow = {
  id: string;
  sku: string;
  name: string;
  price_minor: number | null;
  price_unit: string | null;
  is_published: boolean;
  archived_at: string | null;
  categories: { name: string }[];
};

export type CategoryOption = { id: string; name: string };
export type ProductListParams = {
  q: string;
  status: "" | "published" | "unpublished" | "archived";
  category: string;
  sort: "order" | "name_asc" | "name_desc" | "sku" | "newest";
  page: number;
};
export type RawProductListParams = Record<string, string | string[] | undefined>;
export const PAGE_SIZE = 25;

function single(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

/** Untrusted URL input never reaches a column name or PostgREST expression unchanged. */
export function parseProductListParams(raw: RawProductListParams, categories: CategoryOption[]): ProductListParams {
  const q = single(raw.q).trim().slice(0, 80)
    .replace(/[^\p{L}\p{N}\s.-]/gu, " ").replace(/\s+/g, " ").trim();
  const status = single(raw.status);
  const sort = single(raw.sort);
  const page = single(raw.page);
  return {
    q,
    status: status === "published" || status === "unpublished" || status === "archived" ? status : "",
    category: categories.some(({ id }) => id === single(raw.category)) ? single(raw.category) : "",
    sort: sort === "name_asc" || sort === "name_desc" || sort === "sku" || sort === "newest" ? sort : "order",
    page: /^[1-9]\d{0,5}$/.test(page) ? Number(page) : 1,
  };
}

export function productsHref(params: ProductListParams, page: number): string {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.category) query.set("category", params.category);
  if (params.sort !== "order") query.set("sort", params.sort);
  if (page > 1) query.set("page", String(page));
  return `/admin/products${query.size ? `?${query}` : ""}`;
}

/** No category can appear here solely because of a TEST_ONLY fixture. */
export async function getRealCategoryOptions(supabase: AdminContext["supabase"]): Promise<CategoryOption[]> {
  const { data, error } = await supabase.from("categories")
    .select("id,name,product_categories!inner(products!inner(id))")
    .eq("product_categories.products.catalog_kind", "REAL")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error || !data) throw new Error("Не удалось загрузить категории товаров.");
  return data.map(({ id, name }) => ({ id, name }));
}

function filteredQuery(supabase: AdminContext["supabase"], params: ProductListParams) {
  let query = supabase.from("products")
    .select("id,sku,name,price_minor,price_unit,is_published,archived_at,product_categories(category_id)", { count: "exact" })
    .eq("catalog_kind", "REAL");
  if (params.q) {
    // q has only letters/digits/spaces/dot/hyphen; no PostgREST delimiters or LIKE wildcards.
    query = query.or(`sku.ilike.%${params.q}%,name.ilike.%${params.q}%`);
  }
  if (params.category) query = query.eq("product_categories.category_id", params.category).not("product_categories", "is", null);
  if (params.status === "published") query = query.eq("is_published", true).is("archived_at", null);
  if (params.status === "unpublished") query = query.eq("is_published", false).is("archived_at", null);
  if (params.status === "archived") query = query.not("archived_at", "is", null);
  else query = query.is("archived_at", null);
  return query;
}

export async function getRealProductsPage(
  supabase: AdminContext["supabase"], params: ProductListParams,
): Promise<{ products: ProductListRow[]; total: number; page: number; catalogEmpty: boolean }> {
  function pageQuery(page: number) {
    let query = filteredQuery(supabase, params);
    switch (params.sort) {
      case "name_asc": query = query.order("name", { ascending: true }); break;
      case "name_desc": query = query.order("name", { ascending: false }); break;
      case "sku": query = query.order("sku", { ascending: true }); break;
      case "newest": query = query.order("created_at", { ascending: false }); break;
      default: query = query.order("sort_order", { ascending: true });
    }
    return query.order("id", { ascending: true }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  }

  let page = params.page;
  const initial = await pageQuery(page);
  let { data, error } = initial;
  const { count } = initial;
  if (error || !data || count === null) throw new Error("Не удалось загрузить список товаров.");
  const total = count;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > lastPage) {
    page = lastPage;
    ({ data, error } = await pageQuery(page));
    if (error || !data) throw new Error("Не удалось загрузить список товаров.");
  }

  let catalogEmpty = false;
  if (total === 0) {
    if (!params.q && !params.status && !params.category) {
      catalogEmpty = true;
    } else {
      const baseline = await supabase.from("products").select("id", { count: "exact", head: true })
        .eq("catalog_kind", "REAL");
      if (baseline.error || baseline.count === null) throw new Error("Не удалось загрузить список товаров.");
      catalogEmpty = baseline.count === 0;
    }
  }

  const links = data.length ? await supabase.from("product_categories")
    .select("product_id,categories(name)").in("product_id", data.map(({ id }) => id)) : null;
  if (links?.error) throw new Error("Не удалось загрузить категории товаров.");
  const names = new Map<string, { name: string }[]>();
  for (const link of links?.data ?? []) {
    const category = Array.isArray(link.categories) ? link.categories[0] : link.categories;
    if (category) names.set(link.product_id, [...(names.get(link.product_id) ?? []), category]);
  }
  for (const categories of names.values()) categories.sort((a, b) => a.name.localeCompare(b.name, "ru"));

  return {
    products: data.map((product) => ({
      id: product.id, sku: product.sku, name: product.name, price_minor: product.price_minor,
      price_unit: product.price_unit, is_published: product.is_published, archived_at: product.archived_at,
      categories: names.get(product.id) ?? [],
    })),
    total,
    page,
    catalogEmpty,
  };
}

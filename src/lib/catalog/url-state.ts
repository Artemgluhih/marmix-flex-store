import type { CatalogListParams } from "./query-params";

export function priceInput(minor: number | null): string {
  if (minor === null) return "";
  const rubles = Math.floor(minor / 100);
  const kopeks = minor % 100;
  return kopeks ? `${rubles}.${String(kopeks).padStart(2, "0")}` : String(rubles);
}

export function catalogHref(params: CatalogListParams, page = 1): string {
  const url = new URLSearchParams();
  if (params.q) url.set("q", params.q);
  if (params.priceMinMinor !== null) url.set("price_min", priceInput(params.priceMinMinor));
  if (params.priceMaxMinor !== null) url.set("price_max", priceInput(params.priceMaxMinor));
  if (params.status) url.set("status", params.status);
  if (params.sort !== "order") url.set("sort", params.sort);
  if (page > 1) url.set("page", String(page));
  const query = url.toString();
  const path = params.categorySlug ? `/catalog/${params.categorySlug}` : "/catalog";
  return query ? `${path}?${query}` : path;
}

export function hasActiveCatalogParams(params: CatalogListParams): boolean {
  return Boolean(params.q || params.categorySlug || params.priceMinMinor !== null
    || params.priceMaxMinor !== null || params.status || params.sort !== "order");
}

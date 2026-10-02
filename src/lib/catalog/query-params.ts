/** A technical limit for the server query, not a catalog or owner fact. */
export const PUBLIC_PAGE_SIZE = 24;
const MAX_PAGE = 10_000;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PRICE_RUBLES = /^(0|[1-9]\d{0,8})(?:[.,](\d{1,2}))?$/;

export type CatalogSort = "order" | "price_asc" | "price_desc";

export type CatalogListParams = {
  page: number;
  sort: CatalogSort;
  categorySlug: string | null;
  q: string | null;
  priceMinMinor: number | null;
  priceMaxMinor: number | null;
  status: "in_stock" | "on_order" | null;
};

export type CatalogListInput = {
  page?: unknown; sort?: unknown; categorySlug?: unknown;
  q?: unknown; price_min?: unknown; price_max?: unknown; status?: unknown;
};

export function normalizeSlug(value: unknown): string | null {
  return typeof value === "string" && value.length <= 120 && SLUG.test(value) ? value : null;
}

export function normalizePriceRubles(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = PRICE_RUBLES.exec(value.trim());
  return match ? Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0")) : null;
}

export function normalizeCatalogListParams(input: CatalogListInput = {}): CatalogListParams {
  const candidate = input.page;
  const page = typeof candidate === "number" && Number.isSafeInteger(candidate) ? candidate
    : typeof candidate === "string" && /^[1-9]\d*$/.test(candidate)
      ? candidate.length > 5 ? MAX_PAGE : Number(candidate) : 1;
  const rawQ = typeof input.q === "string" ? input.q.trim() : "";
  const q = rawQ.slice(0, 80).replace(/[^\p{L}\p{N} -]/gu, " ").replace(/ +/g, " ").trim() || null;

  return {
    page: page < 1 ? 1 : Math.min(page, MAX_PAGE),
    sort: input.sort === "price_asc" || input.sort === "price_desc" ? input.sort : "order",
    categorySlug: input.categorySlug === undefined || input.categorySlug === null
      ? null : normalizeSlug(input.categorySlug),
    q,
    priceMinMinor: normalizePriceRubles(input.price_min),
    priceMaxMinor: normalizePriceRubles(input.price_max),
    status: input.status === "in_stock" || input.status === "on_order" ? input.status : null,
  };
}

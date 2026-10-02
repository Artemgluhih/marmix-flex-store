/** A technical limit for the server query, not a catalog or owner fact. */
export const PUBLIC_PAGE_SIZE = 24;
const MAX_PAGE = 10_000;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type CatalogListParams = {
  page: number;
  sort: "order";
  categorySlug: string | null;
};

export function normalizeSlug(value: unknown): string | null {
  return typeof value === "string" && value.length <= 120 && SLUG.test(value) ? value : null;
}

export function normalizeCatalogListParams(input: {
  page?: unknown;
  sort?: unknown;
  categorySlug?: unknown;
} = {}): CatalogListParams {
  const candidate = input.page;
  const page = (typeof candidate === "number" && Number.isSafeInteger(candidate)) ? candidate
    : typeof candidate === "string" && /^[1-9]\d{0,4}$/.test(candidate) ? Number(candidate) : 1;

  return {
    page: page >= 1 && page <= MAX_PAGE ? page : 1,
    // T041 may extend this whitelist; never pass URL column/order names to PostgREST.
    sort: "order",
    categorySlug: input.categorySlug === undefined || input.categorySlug === null
      ? null : normalizeSlug(input.categorySlug),
  };
}

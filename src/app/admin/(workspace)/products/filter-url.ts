/** Filter changes always return to page one; the server validates values. */
export function productFilterHref(values: URLSearchParams): string {
  const query = new URLSearchParams();
  for (const key of ["q", "status", "category", "sort"]) {
    const value = (values.get(key) ?? "").trim();
    if (value && !(key === "sort" && value === "order")) query.set(key, value);
  }
  return `/admin/products${query.size ? `?${query}` : ""}`;
}

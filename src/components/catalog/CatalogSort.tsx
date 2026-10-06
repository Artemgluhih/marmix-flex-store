"use client";

import type { CatalogSort as Sort } from "@/lib/catalog/query-params";

/** Native GET submit remains available without JS; only sort selection is enhanced. */
export function CatalogSort({ value }: { value: Sort }) {
  return <select name="sort" defaultValue={value} onChange={(event) => event.currentTarget.form?.requestSubmit()}>
    <option value="order">По умолчанию</option>
    <option value="price_asc">Цена: по возрастанию</option>
    <option value="price_desc">Цена: по убыванию</option>
  </select>;
}

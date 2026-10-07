import { validProductId } from "./[id]/edit-validation";

export type ProductOrderRow = { id: string; sort_order: number };

export function productOrderVersion(rows: ProductOrderRow[]): string {
  return JSON.stringify([...rows].sort((a, b) => a.id.localeCompare(b.id)).map(({ id, sort_order }) => [id, sort_order]));
}

export function validProductOrder(ids: unknown, rows: ProductOrderRow[]): ids is string[] {
  return Array.isArray(ids) && ids.length === rows.length && new Set(ids).size === ids.length
    && ids.every((id) => typeof id === "string" && validProductId(id) && rows.some((row) => row.id === id));
}

export function moveProduct<T>(rows: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= rows.length || to >= rows.length || from === to) return rows;
  const next = [...rows];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

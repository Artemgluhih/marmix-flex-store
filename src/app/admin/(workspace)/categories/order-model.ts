import { validCategoryId } from "./category-validation";

export type CategoryOrderRow = { id: string; sort_order: number };

export function categoryOrderVersion(rows: CategoryOrderRow[]): string {
  return JSON.stringify([...rows].sort((a, b) => a.id.localeCompare(b.id)).map(({ id, sort_order }) => [id, sort_order]));
}

export function validCategoryOrder(ids: unknown, rows: CategoryOrderRow[]): ids is string[] {
  return Array.isArray(ids) && ids.length === rows.length && new Set(ids).size === ids.length
    && ids.every((id) => typeof id === "string" && validCategoryId(id) && rows.some((row) => row.id === id));
}

export function moveCategory<T>(rows: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= rows.length || to >= rows.length || from === to) return rows;
  const next = [...rows];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

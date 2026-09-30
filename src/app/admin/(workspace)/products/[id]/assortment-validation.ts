export type Availability = "" | "in_stock" | "on_order";
export type AssortmentInput = { availability_status: "in_stock" | "on_order" | null; is_featured: boolean; sort_order: number };
export type AssortmentErrors = { availability?: string; sort_order?: string; form?: string };

export function validateAssortment(form: FormData): { input?: AssortmentInput; errors: AssortmentErrors; values: { availability: string; featured: boolean; sortOrder: string } } {
  const availability = form.get("availability") ?? "";
  const featured = form.get("featured") === "on";
  const sortOrder = form.get("sort_order") ?? "";
  const values = {
    availability: typeof availability === "string" ? availability : "",
    featured,
    sortOrder: typeof sortOrder === "string" ? sortOrder.trim() : "",
  };
  const errors: AssortmentErrors = {};
  if (!["", "in_stock", "on_order"].includes(values.availability) || form.getAll("availability").length !== 1) {
    errors.availability = "Выберите допустимый статус наличия.";
  }
  if (form.getAll("featured").length > 1 || (form.has("featured") && form.get("featured") !== "on")) {
    errors.form = "Некорректное значение выделения.";
  }
  if (!/^(0|[1-9]\d{0,9})$/.test(values.sortOrder) || Number(values.sortOrder) > 2147483647 || form.getAll("sort_order").length !== 1) {
    errors.sort_order = "Укажите целое неотрицательное число до 2147483647.";
  }
  if (Object.keys(errors).length) return { errors, values };
  return { input: { availability_status: values.availability ? values.availability as "in_stock" | "on_order" : null, is_featured: featured, sort_order: Number(values.sortOrder) }, errors, values };
}

export const transitions = ["publish", "unpublish", "archive", "restore"] as const;
export type Transition = typeof transitions[number];

export function transitionPatch(command: Transition, product: { is_published: boolean; archived_at: string | null }) {
  switch (command) {
    case "publish": return product.archived_at ? { error: "Сначала восстановите товар из архива." } : { patch: { is_published: true } };
    case "unpublish": return product.archived_at ? { error: "Товар уже находится в архиве." } : { patch: { is_published: false } };
    case "archive": return product.archived_at ? { error: "Товар уже находится в архиве." } : { patch: { archived_at: new Date().toISOString(), is_published: false } };
    case "restore": return product.archived_at ? { patch: { archived_at: null, is_published: false } } : { error: "Товар не находится в архиве." };
  }
}

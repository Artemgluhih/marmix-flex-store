export const productFields = [
  "name", "sku", "slug", "series", "price", "price_unit", "sale_unit", "min_quantity", "quantity_step",
] as const;
export type ProductField = (typeof productFields)[number];
export type ProductValues = Record<ProductField, string>;
export type ProductErrors = Partial<Record<ProductField | "category_ids" | "form", string>>;
export type ProductInput = {
  name: string;
  sku: string;
  slug: string;
  category_ids: string[];
  series: string | null;
  price_minor: number | null;
  price_unit: "м²" | "шт./упаковка" | null;
  sale_unit: "sheet" | "шт./упаковка" | null;
  min_quantity: number | null;
  quantity_step: number | null;
};

export const emptyProductValues: ProductValues = Object.fromEntries(productFields.map((field) => [field, ""])) as ProductValues;

function positiveInteger(value: string): number | null {
  if (!/^[1-9]\d{0,9}$/.test(value)) return null;
  const parsed = Number(value);
  return parsed <= 2147483647 ? parsed : null;
}

/** Decimal string to integer kopecks; no floating-point rounding or guessed price. */
function rublesToMinor(value: string): number | null {
  if (!/^(?:0|[1-9]\d{0,11})(?:[.,]\d{1,2})?$/.test(value)) return null;
  const [rubles, kopecks = ""] = value.replace(",", ".").split(".");
  const minor = BigInt(rubles) * BigInt(100) + BigInt((kopecks + "00").slice(0, 2));
  return minor > BigInt(0) && minor <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(minor) : null;
}

export function validateProductValues(values: ProductValues, categoryIds: readonly string[], selectedIds: readonly string[]):
  { input: ProductInput; errors: ProductErrors } | { input: null; errors: ProductErrors } {
  const errors: ProductErrors = {};
  const name = values.name.trim();
  const sku = values.sku.trim();
  const slug = values.slug.trim();
  const series = values.series.trim();
  const price = values.price.trim();
  const price_unit = values.price_unit.trim();
  const sale_unit = values.sale_unit.trim();
  const minimum = values.min_quantity.trim();
  const step = values.quantity_step.trim();

  if (!name || name.length > 160) errors.name = "Укажите название до 160 символов.";
  if (sku.length > 80 || !/^MF-[A-Z0-9]+-[0-9]{4,}$/.test(sku)) errors.sku = "Укажите SKU формата MF-ABC-0000.";
  if (slug.length > 160 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) errors.slug = "Используйте строчные латинские буквы, цифры и дефис между словами.";
  const category_ids = [...new Set(selectedIds)];
  if (category_ids.length > 100 || category_ids.some((id) =>
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || !categoryIds.includes(id)
  )) errors.category_ids = "Выберите существующие категории.";
  if (series.length > 120) errors.series = "Серия не должна быть длиннее 120 символов.";

  const price_minor = price ? rublesToMinor(price) : null;
  if (price && price_minor === null) errors.price = "Укажите положительную цену в рублях, до двух знаков после запятой.";
  if (price_unit && price_unit !== "м²" && price_unit !== "шт./упаковка") errors.price_unit = "Выберите допустимую единицу цены.";
  if (sale_unit && sale_unit !== "sheet" && sale_unit !== "шт./упаковка") errors.sale_unit = "Выберите допустимую единицу продажи.";
  if (price && !price_unit) errors.price_unit = "Для указанной цены выберите единицу.";
  if (price_unit && sale_unit && !(
    (price_unit === "м²" && sale_unit === "sheet") ||
    (price_unit === "шт./упаковка" && sale_unit === "шт./упаковка")
  )) errors.sale_unit = "Единицы цены и продажи не соответствуют друг другу.";

  const min_quantity = minimum ? positiveInteger(minimum) : null;
  const quantity_step = step ? positiveInteger(step) : null;
  if (minimum && min_quantity === null) errors.min_quantity = "Укажите целое число больше нуля.";
  if (step && quantity_step === null) errors.quantity_step = "Укажите целое число больше нуля.";
  if (Object.keys(errors).length) return { input: null, errors };

  return { input: {
    name, sku, slug, category_ids, series: series || null, price_minor,
    price_unit: (price_unit || null) as ProductInput["price_unit"],
    sale_unit: (sale_unit || null) as ProductInput["sale_unit"],
    min_quantity, quantity_step,
  }, errors };
}

export function valuesFromForm(formData: FormData): ProductValues {
  return Object.fromEntries(productFields.map((field) => {
    const value = formData.get(field);
    // Bound returned form values as well as data sent to the DB.
    return [field, typeof value === "string" ? value.slice(0, 1024) : ""];
  })) as ProductValues;
}

/** Never return raw database errors or constraint names to the form. */
export function uniqueProductError(code: string, message: string): ProductErrors | null {
  if (code !== "23505") return null;
  if (message.includes("products_sku_key")) return { sku: "Такой SKU уже существует." };
  if (message.includes("products_slug_key")) return { slug: "Такой адрес уже существует." };
  return null;
}

export const MAX_SPECS = 8;
export const editFields = ["description", "width_mm", "height_mm", "thickness_mm", "area_per_sale_unit_m2", "seo_title", "seo_description"] as const;
export type EditField = (typeof editFields)[number];
export type EditValues = Record<EditField, string> & { specs: { key: string; value: string }[] };
export type EditErrors = Partial<Record<EditField | "specs" | "form", string>>;
export type EditInput = {
  description: string | null;
  width_mm: number | null;
  height_mm: number | null;
  thickness_mm: number | null;
  area_per_sale_unit_m2: string | null;
  specifications: Record<string, string>;
  seo_title: string | null;
  seo_description: string | null;
};

export const validProductId = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export function readEditValues(form: FormData): EditValues {
  const get = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value.slice(0, 6000) : "";
  };
  return {
    ...Object.fromEntries(editFields.map((field) => [field, get(field)])) as Record<EditField, string>,
    specs: Array.from({ length: MAX_SPECS }, (_, index) => ({
      key: get(`spec_key_${index}`), value: get(`spec_value_${index}`),
    })),
  };
}

function positiveMillimetres(value: string): number | null {
  if (!/^[1-9]\d{0,9}$/.test(value)) return null;
  const parsed = Number(value);
  return parsed <= 2147483647 ? parsed : null;
}

/** Exact decimal text for numeric(14,4); no floating-point conversion. */
function positiveArea(value: string): string | null {
  if (!/^(?:0|[1-9]\d{0,9})(?:[.,]\d{1,4})?$/.test(value)) return null;
  if (!/[1-9]/.test(value)) return null;
  return value.replace(",", ".");
}

export function validateEditValues(values: EditValues, sale: { price_unit: string | null; sale_unit: string | null }):
  { input: EditInput; errors: EditErrors } | { input: null; errors: EditErrors } {
  const errors: EditErrors = {};
  const description = values.description.trim();
  const seo_title = values.seo_title.trim();
  const seo_description = values.seo_description.trim();
  if (description.length > 5000 || /[<>\u0000]/u.test(description)) errors.description = "Описание: до 5000 символов, без HTML.";
  if (seo_title.length > 180 || /[<>\u0000]/u.test(seo_title)) errors.seo_title = "SEO-заголовок: до 180 символов, без HTML.";
  if (seo_description.length > 320 || /[<>\u0000]/u.test(seo_description)) errors.seo_description = "SEO-описание: до 320 символов, без HTML.";

  const dimensions = {} as Record<"width_mm" | "height_mm" | "thickness_mm", number | null>;
  for (const field of ["width_mm", "height_mm", "thickness_mm"] as const) {
    const raw = values[field].trim();
    dimensions[field] = raw ? positiveMillimetres(raw) : null;
    if (raw && dimensions[field] === null) errors[field] = "Укажите положительное целое число миллиметров.";
  }
  const areaRaw = values.area_per_sale_unit_m2.trim();
  const area = areaRaw ? positiveArea(areaRaw) : null;
  if (areaRaw && (!area || sale.price_unit !== "м²" || sale.sale_unit !== "sheet")) {
    errors.area_per_sale_unit_m2 = "Площадь доступна только для листа с ценой за м²; укажите положительное число до 4 знаков после запятой.";
  }

  const specs: Record<string, string> = Object.create(null);
  for (const pair of values.specs) {
    const key = pair.key.trim();
    const value = pair.value.trim();
    if (!key && !value) continue;
    if (!key || !value || key.length > 64 || value.length > 240 ||
      !/^[\p{L}\p{N}][\p{L}\p{N} _./()%°-]*$/u.test(key) ||
      /[<>\u0000-\u001f]/u.test(value) ||
      ["__proto__", "constructor", "prototype"].includes(key.toLowerCase()) ||
      Object.hasOwn(specs, key)) {
      errors.specs = "Заполните пары «Название — Значение» без HTML и повторов; название до 64, значение до 240 символов.";
      break;
    }
    specs[key] = value;
  }
  if (Object.keys(errors).length) return { input: null, errors };
  return { input: {
    description: description || null,
    ...dimensions,
    area_per_sale_unit_m2: area,
    specifications: specs,
    seo_title: seo_title || null,
    seo_description: seo_description || null,
  }, errors };
}

export function editValuesFromProduct(row: {
  description: string | null; width_mm: number | null; height_mm: number | null; thickness_mm: number | null;
  area_per_sale_unit_m2: number | string | null; seo_title: string | null; seo_description: string | null;
  specifications: unknown;
}): EditValues | null {
  if (!row.specifications || typeof row.specifications !== "object" || Array.isArray(row.specifications)) return null;
  const entries = Object.entries(row.specifications);
  if (entries.length > MAX_SPECS || entries.some(([, value]) => typeof value !== "string")) return null;
  return {
    description: row.description ?? "",
    width_mm: row.width_mm?.toString() ?? "",
    height_mm: row.height_mm?.toString() ?? "",
    thickness_mm: row.thickness_mm?.toString() ?? "",
    area_per_sale_unit_m2: row.area_per_sale_unit_m2?.toString() ?? "",
    seo_title: row.seo_title ?? "",
    seo_description: row.seo_description ?? "",
    specs: Array.from({ length: MAX_SPECS }, (_, index) => ({ key: entries[index]?.[0] ?? "", value: entries[index]?.[1] as string ?? "" })),
  };
}

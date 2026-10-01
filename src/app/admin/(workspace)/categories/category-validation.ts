export const categoryFields = ["name", "slug", "description", "sort_order", "seo_title", "seo_description", "status"] as const;
export type CategoryField = typeof categoryFields[number];
export type CategoryValues = Record<CategoryField, string>;
export type CategoryErrors = Partial<Record<CategoryField | "form", string>>;
export type CategoryInput = {
  name: string; slug: string; description: string | null; sort_order: number;
  seo_title: string | null; seo_description: string | null; is_published: boolean;
};

export const emptyCategoryValues: CategoryValues = {
  name: "", slug: "", description: "", sort_order: "0", seo_title: "", seo_description: "", status: "draft",
};

export function validCategoryId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function categoryValuesFromForm(form: FormData): CategoryValues {
  return Object.fromEntries(categoryFields.map((field) => {
    const value = form.get(field);
    return [field, typeof value === "string" ? value.slice(0, 6000) : ""];
  })) as CategoryValues;
}

export function validateCategory(values: CategoryValues, mode: "create" | "edit"):
  { input: CategoryInput | null; errors: CategoryErrors } {
  const errors: CategoryErrors = {};
  const name = values.name.trim();
  const slug = values.slug.trim();
  const description = values.description.trim();
  const seo_title = values.seo_title.trim();
  const seo_description = values.seo_description.trim();
  const sort = values.sort_order.trim();
  if (!name || name.length > 160) errors.name = "Укажите название до 160 символов.";
  if (slug.length > 160 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) errors.slug = "Используйте строчные латинские буквы, цифры и дефис между словами.";
  if (description.length > 5000) errors.description = "Описание не должно быть длиннее 5000 символов.";
  if (seo_title.length > 180) errors.seo_title = "SEO-заголовок не должен быть длиннее 180 символов.";
  if (seo_description.length > 320) errors.seo_description = "SEO-описание не должно быть длиннее 320 символов.";
  if (!/^(0|[1-9]\d{0,9})$/.test(sort) || Number(sort) > 2147483647) errors.sort_order = "Укажите целое неотрицательное число до 2147483647.";
  if (mode === "edit" && !["draft", "published"].includes(values.status)) errors.status = "Выберите допустимый статус.";
  if (mode === "create" && values.status !== "draft") errors.status = "Новая категория сохраняется черновиком.";
  if (Object.keys(errors).length) return { input: null, errors };
  return { input: {
    name, slug, description: description || null, sort_order: Number(sort),
    seo_title: seo_title || null, seo_description: seo_description || null,
    is_published: mode === "edit" && values.status === "published",
  }, errors };
}

export function categoryValuesFromRow(row: CategoryInput): CategoryValues {
  return { name: row.name, slug: row.slug, description: row.description ?? "", sort_order: String(row.sort_order),
    seo_title: row.seo_title ?? "", seo_description: row.seo_description ?? "", status: row.is_published ? "published" : "draft" };
}

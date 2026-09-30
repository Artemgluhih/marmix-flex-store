import type { ProductListRow } from "./products-list";

export function productStatus(product: Pick<ProductListRow, "archived_at" | "is_published">) {
  if (product.archived_at !== null) return "В архиве";
  return product.is_published ? "Опубликован" : "Скрыт";
}

const rub = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function productPrice(product: Pick<ProductListRow, "price_minor" | "price_unit">) {
  if (product.price_minor === null) return "Не указана";
  const amount = rub.format(product.price_minor / 100);
  return product.price_unit ? `${amount} / ${product.price_unit}` : amount;
}

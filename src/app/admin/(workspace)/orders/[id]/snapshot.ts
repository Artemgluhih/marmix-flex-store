/** Order history is read from the stored JSONB value, never from catalog data. */
export type SnapshotItem = {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  saleUnit: string;
  priceMinor: number;
  priceUnit: string;
  lineTotalMinor: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validOrderId(value: string): boolean {
  return UUID.test(value);
}

export function validMinor(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function parseOrderSnapshot(value: unknown): SnapshotItem[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 50) return null;
  const items: SnapshotItem[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
    const item = entry as Record<string, unknown>;
    if (!nonEmpty(item.product_id) || !validOrderId(item.product_id) ||
        !nonEmpty(item.sku) || !nonEmpty(item.name) ||
        !Number.isSafeInteger(item.quantity) || typeof item.quantity !== "number" || item.quantity <= 0 ||
        !nonEmpty(item.sale_unit) || !validMinor(item.price_minor) ||
        !nonEmpty(item.price_unit) || !validMinor(item.line_total_minor)) return null;
    items.push({
      productId: item.product_id,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      saleUnit: item.sale_unit,
      priceMinor: item.price_minor,
      priceUnit: item.price_unit,
      lineTotalMinor: item.line_total_minor,
    });
  }
  return items;
}

const integerFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
export function formatStoredRub(minor: number): string {
  const value = BigInt(minor);
  const rubles = integerFormatter.format(value / BigInt(100));
  const kopecks = value % BigInt(100);
  return `${rubles}${kopecks === BigInt(0) ? "" : `,${String(kopecks).padStart(2, "0")}`} ₽`;
}

export function displaySaleUnit(unit: string): string {
  return unit === "sheet" ? "лист" : unit;
}

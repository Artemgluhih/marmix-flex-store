import "server-only";
import type { PublicProductDetail } from "@/lib/catalog/types";
import { evaluateCommerce, exactTotalMinor } from "@/lib/catalog/commerce";
import { getSiteUrl } from "./metadata";

type Breadcrumb = { name: string; path: string };

export function breadcrumbStructuredData(items: Breadcrumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ name, path }, index) => ({
      "@type": "ListItem", position: index + 1, name,
      item: new URL(path, getSiteUrl()).toString(),
    })),
  };
}

export const catalogBreadcrumb = () => breadcrumbStructuredData([
  { name: "Главная", path: "/" }, { name: "Каталог", path: "/catalog" },
]);

export function categoryBreadcrumb(name: string, slug: string) {
  return breadcrumbStructuredData([
    { name: "Главная", path: "/" }, { name: "Каталог", path: "/catalog" },
    { name, path: `/catalog/${slug}` },
  ]);
}

export function productBreadcrumb(name: string, slug: string) {
  return breadcrumbStructuredData([
    { name: "Главная", path: "/" }, { name: "Каталог", path: "/catalog" },
    { name, path: `/product/${slug}` },
  ]);
}

/** Accept only the DTO returned by getPublishedProduct, which enforces REAL/published/non-archived guest/RLS reads. */
export function productStructuredData(product: PublicProductDetail) {
  if (product.catalogKind !== "REAL" || !product.isPublished || product.archivedAt !== null) return null;
  // `on_order` is orderable in the application but has no approved schema.org availability mapping.
  if (product.availabilityStatus !== "in_stock") return null;
  const commerce = evaluateCommerce(product, true);
  if (commerce?.commercialStatus !== "ready" || !commerce.calculation) return null;
  const minor = exactTotalMinor(commerce, commerce.min);
  if (minor === null || minor <= 0 || product.currency !== "RUB" ||
      !product.priceUnit || !product.saleUnit || !product.name.trim() || !product.sku.trim()) return null;

  const url = new URL(`/product/${product.slug}`, getSiteUrl()).toString();
  const description = product.seoDescription?.trim() || product.description?.trim();
  // The price is for the minimum purchasable quantity in sale units, never a panel's per-m² display price.
  const exactMinor = BigInt(minor);
  const price = `${exactMinor / BigInt(100)}.${String(exactMinor % BigInt(100)).padStart(2, "0")}`;
  return {
    "@context": "https://schema.org", "@type": "Product",
    name: product.name, sku: product.sku, url,
    ...(description ? { description } : {}),
    ...(product.primaryImage ? { image: product.primaryImage.url } : {}),
    offers: {
      "@type": "Offer", url, priceCurrency: "RUB", price,
      availability: "https://schema.org/InStock",
    },
  };
}

/** Escape script terminators from user-controlled product/category text without changing JSON values. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

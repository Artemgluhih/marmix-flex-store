import "server-only";
import type { Metadata } from "next";
import type { PublicProductDetail } from "@/lib/catalog/types";
import type { SeoCategory } from "./public-catalog";
import { getSiteUrl, NO_INDEX, publicRobots } from "./metadata";

export type SeoSearchParams = Record<string, string | string[] | undefined>;
export const CATALOG_DESCRIPTION = "Каталог декоративных материалов Marmix Flex: гибкий мрамор, травертин и сопутствующие материалы.";

export function hasCatalogFilter(raw: SeoSearchParams): boolean {
  return ["category", "q", "price_min", "price_max", "status", "sort", "page"]
    .some((key) => raw[key] !== undefined);
}

function pageMetadata(title: string, description: string, path: string, filtered = false,
  image?: PublicProductDetail["primaryImage"]): Metadata {
  // Admin titles sometimes already carry the brand suffix; don't append it twice.
  const cleanTitle = title.trim().replace(/\s*[—–·|-]\s*Marmix Flex\s*$/i, "").trim() || "Marmix Flex";
  const branded = cleanTitle === "Marmix Flex" ? cleanTitle : `${cleanTitle} — Marmix Flex`;
  const canonical = new URL(path, getSiteUrl()).toString();
  return {
    title: { absolute: branded }, description,
    alternates: { canonical },
    robots: filtered && process.env.VERCEL_ENV === "production"
      ? { index: false, follow: true } : filtered ? { ...NO_INDEX } : publicRobots(),
    openGraph: { title: branded, description, url: canonical, siteName: "Marmix Flex", locale: "ru_RU", type: "website",
      ...(image ? { images: [{ url: image.url, alt: image.alt ?? "", width: image.width, height: image.height }] } : {}) },
  };
}

export function catalogMetadata(raw: SeoSearchParams, category: SeoCategory | null): Metadata {
  return pageMetadata("Каталог", CATALOG_DESCRIPTION,
    category ? `/catalog/${category.slug}` : "/catalog", hasCatalogFilter(raw));
}

export function categoryMetadata(category: SeoCategory, raw: SeoSearchParams): Metadata {
  return pageMetadata(category.seoTitle?.trim() || category.name,
    category.seoDescription?.trim() || category.description?.trim() || `Материалы категории «${category.name}» в каталоге Marmix Flex.`,
    `/catalog/${category.slug}`, hasCatalogFilter(raw));
}

export function productMetadata(product: PublicProductDetail): Metadata {
  return pageMetadata(product.seoTitle?.trim() || product.name,
    product.seoDescription?.trim() || product.description?.trim() || `${product.name} в каталоге Marmix Flex. Подтверждённые данные товара и изображения.`,
    `/product/${product.slug}`, false, product.primaryImage);
}

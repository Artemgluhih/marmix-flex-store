import "server-only";
import type { Metadata } from "next";

export const NO_INDEX = { index: false, follow: false } as const;
export const SITE_DESCRIPTION = "Каталог декоративных материалов Marmix Flex: гибкий мрамор, травертин и сопутствующие материалы. Сургут и Москва.";

type StaticPath = "/" | "/applications" | "/about" | "/delivery" | "/contacts" | "/privacy" | "/terms";

/** Canonicals use the configured public origin, never a request host or deployment URL. */
export function getSiteUrl(): URL {
  const value = process.env.SITE_URL?.trim();
  if (!value) throw new Error("SITE_URL is required for metadata.");
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("SITE_URL must be an absolute HTTPS origin."); }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
      url.pathname !== "/" || url.hostname === "localhost" || url.hostname.endsWith(".localhost") ||
      url.hostname === "127.0.0.1" || url.hostname === "[::1]" || url.hostname.endsWith(".vercel.app")) {
    throw new Error("SITE_URL must be a public HTTPS origin without credentials, path, query or fragment.");
  }
  return new URL(url.origin);
}

/** NODE_ENV=production also applies to Preview builds, so it cannot authorize indexing. */
export function publicRobots(): Metadata["robots"] {
  return process.env.VERCEL_ENV === "production" ? { index: true, follow: true } : { ...NO_INDEX };
}

export function createRootMetadata(): Metadata {
  return {
    metadataBase: getSiteUrl(),
    title: { default: "Marmix Flex", template: "%s — Marmix Flex" },
    description: SITE_DESCRIPTION,
    robots: publicRobots(),
  };
}

export function createStaticMetadata({ path, title, description, absoluteTitle = false, legalPending = false }: {
  path: StaticPath;
  title: string;
  description: string;
  absoluteTitle?: boolean;
  legalPending?: boolean;
}): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: new URL(path, getSiteUrl()).toString() },
    robots: legalPending ? { ...NO_INDEX } : publicRobots(),
  };
}

export function createPrivateMetadata(title: string, description: string): Metadata {
  return { title, description, robots: { ...NO_INDEX } };
}

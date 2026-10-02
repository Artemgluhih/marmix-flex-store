export type PublicCategory = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
};

export type PublicImage = {
  url: string;
  alt: string | null;
  role: string | null;
  width: number;
  height: number;
  isPrimary: boolean;
  sortOrder: number;
};

export type PublicProduct = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  series: string | null;
  priceMinor: number | null;
  currency: string;
  priceUnit: string | null;
  saleUnit: string | null;
  minQuantity: number | null;
  quantityStep: number | null;
  areaPerSaleUnitM2: number | null;
  sourcePriceRange: string | null;
  availabilityStatus: string | null;
  isFeatured: boolean;
  sortOrder: number;
  categories: PublicCategory[];
  primaryImage: PublicImage | null;
};

export type PublicProductDetail = PublicProduct & {
  description: string | null;
  widthMm: number | null;
  heightMm: number | null;
  thicknessMm: number | null;
  specifications: Record<string, unknown>;
  seoTitle: string | null;
  seoDescription: string | null;
  images: PublicImage[];
};

export type CatalogFacets = {
  categories: PublicCategory[];
  fixedPriceMinor: { min: number; max: number } | null;
  availabilityStatuses: string[];
};

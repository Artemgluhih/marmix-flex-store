import { evaluateCommerce } from "@/lib/catalog/commerce";
import type { PublicProduct } from "@/lib/catalog/types";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { QuantityBlock } from "../product/[slug]/QuantityBlock";
import { TechnicalCartControls } from "./TechnicalCartControls";

export const dynamic = "force-dynamic";
const TECHNICAL_PRODUCT_ID = "technical-t049-cart-interaction";

const fixture: PublicProduct = {
  id: TECHNICAL_PRODUCT_ID, sku: "TECHNICAL-T049", slug: "technical-t049-not-real",
  name: "TECHNICAL CART INTERACTION REVIEW — NOT REAL PRODUCT", series: null,
  priceMinor: 200000, currency: "RUB", priceUnit: "м²", saleUnit: "sheet",
  minQuantity: 1, quantityStep: 1, areaPerSaleUnitM2: 4.0328,
  sourcePriceRange: null, availabilityStatus: "in_stock", isFeatured: false,
  sortOrder: 0, categories: [], primaryImage: null,
};

export default function TechnicalCartReview() {
  const model = evaluateCommerce(fixture, true);
  if (!model || model.commercialStatus !== "ready") throw new Error("Technical commerce fixture is invalid");
  const snapshot = { name: fixture.name, primaryImageUrl: null, priceMinor: fixture.priceMinor,
    currency: fixture.currency, priceUnit: fixture.priceUnit, saleUnit: fixture.saleUnit };

  return <section style={{ maxWidth: 1100, margin: "6rem auto", padding: "0 20px 5rem" }}>
    <h1>TECHNICAL CART INTERACTION REVIEW — NOT REAL PRODUCT</h1>
    <p>Render-only fixture. No Supabase row or REAL SKU.</p>
    <div style={{ maxWidth: 500 }}><QuantityBlock model={model} productId={fixture.id} snapshot={snapshot} /></div>
    <TechnicalCartControls productId={fixture.id} model={model} snapshot={snapshot} />
    <h2>Technical Product Card action</h2>
    <div style={{ maxWidth: 380 }}><ProductGrid products={[fixture]} titleLevel={3} /></div>
  </section>;
}

import type { Metadata } from "next";
import { evaluateCommerce } from "@/lib/catalog/commerce";
import { QuantityBlock } from "../product/[slug]/QuantityBlock";

export const metadata: Metadata = { title: "Technical quantity review", robots: { index: false, follow: false } };

export default function TechnicalQuantityReview() {
  // Render-only model. No product row, no Supabase mutation, and no public catalog link.
  const panel = evaluateCommerce({
    priceMinor: 200000, currency: "RUB", priceUnit: "м²", saleUnit: "sheet",
    minQuantity: 1, quantityStep: 1, areaPerSaleUnitM2: 4.0328, availabilityStatus: "in_stock",
  }, true);
  const accessory = evaluateCommerce({
    priceMinor: 160000, currency: "RUB", priceUnit: "шт./упаковка", saleUnit: "шт./упаковка",
    minQuantity: 1, quantityStep: 1, areaPerSaleUnitM2: null, availabilityStatus: "on_order",
  }, true);

  return (
    <main style={{ maxWidth: 800, padding: "48px 20px 100px", margin: "auto" }}>
      <h1>TECHNICAL QUANTITY REVIEW — NOT REAL PRODUCT</h1>
      <p>Только проверка расчёта и управления количеством. Значения ниже не назначены товару.</p>
      <section style={{ maxWidth: 460, marginTop: 40 }} aria-label="Технический пример: листы">
        <h2>Технический пример: листы</h2>
        {panel && <QuantityBlock model={panel} />}
      </section>
      <section style={{ maxWidth: 460, marginTop: 70 }} aria-label="Технический пример: упаковки">
        <h2>Технический пример: упаковки</h2>
        {accessory && <QuantityBlock model={accessory} />}
      </section>
    </main>
  );
}

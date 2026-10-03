"use client";

import { useState } from "react";
import type { CartLine } from "@/lib/cart/model";
import type { PublicProduct } from "@/lib/catalog/types";
import { CheckoutContent } from "../checkout/CheckoutContent";
import styles from "../checkout/checkout.module.css";

const panel: PublicProduct = {
  id: "11111111-1111-4111-8111-111111111111", sku: "TECHNICAL-ONLY", slug: "technical-not-real",
  name: "Техническая фактура для проверки длинного названия и переноса строки", series: null,
  priceMinor: 200000, currency: "RUB", priceUnit: "м²", saleUnit: "sheet", minQuantity: 1, quantityStep: 1,
  areaPerSaleUnitM2: 4.0328, sourcePriceRange: null, availabilityStatus: "in_stock", isFeatured: false,
  sortOrder: 0, categories: [], primaryImage: null,
};
const accessory: PublicProduct = {
  ...panel, id: "22222222-2222-4222-8222-222222222222", name: "Технический аксессуар",
  priceMinor: 160000, priceUnit: "шт./упаковка", saleUnit: "шт./упаковка", areaPerSaleUnitM2: null,
};
const lines: CartLine[] = [panel, accessory].map((product, index) => ({
  productId: product.id, quantity: index ? 1 : 3,
  snapshot: { name: product.name, priceMinor: product.priceMinor, currency: product.currency,
    priceUnit: product.priceUnit, saleUnit: product.saleUnit, primaryImageUrl: null },
}));

type Scenario = "ready" | "validating" | "form-error" | "unready" | "empty" | "hydrating" | "refreshing" | "refresh-error";

export function TechnicalCheckoutReview() {
  const [scenario, setScenario] = useState<Scenario>("ready");
  const phase = scenario === "empty" ? "empty" : scenario === "hydrating" ? "hydrating" :
    scenario === "refreshing" ? "refreshing" : scenario === "refresh-error" ? "error" : "ready";
  return <section className={styles.page} aria-labelledby="checkout-title">
    <p className={styles.eyebrow}>TECHNICAL CHECKOUT FORM REVIEW — NOT REAL SUBMISSION</p>
    <header className={styles.intro}><h1 id="checkout-title">Заявка · техническая проверка</h1>
      <p className={styles.formLead}>Синтетические позиции только в props. Они не записываются в Supabase или browser storage; контакты не отправляются.</p>
      <label htmlFor="technical-scenario">Состояние</label>{" "}
      <select id="technical-scenario" value={scenario} onChange={(event) => setScenario(event.target.value as Scenario)}>
        <option value="ready">Готовая форма</option>
        <option value="validating">Проверка полей</option>
        <option value="form-error">Техническая ошибка отправки</option>
        <option value="unready">Корзина требует проверки</option>
        <option value="empty">Пустая корзина</option>
        <option value="hydrating">Гидратация</option>
        <option value="refreshing">Проверка позиций</option>
        <option value="refresh-error">Ошибка проверки корзины</option>
      </select>
    </header>
    <CheckoutContent key={scenario} technical lines={scenario === "empty" ? [] : lines}
      products={scenario === "unready" ? [{ ...panel, availabilityStatus: null }, accessory] : [panel, accessory]}
      phase={phase} technicalFormState={scenario === "validating" ? "validating" : scenario === "form-error" ? "error" : "normal"} />
  </section>;
}

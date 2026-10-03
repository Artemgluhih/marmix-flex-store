"use client";

import { useState } from "react";
import { CartContent, type CartPhase } from "../cart/CartContent";
import { currentSnapshot } from "@/lib/cart/reconcile";
import { updateQuantity, removeLine, upsertLine, CART_VERSION, type CartLine, type CartState } from "@/lib/cart/model";
import { CART_STORAGE_KEY } from "@/lib/cart/storage";
import type { PublicProduct } from "@/lib/catalog/types";
import styles from "./review.module.css";

const panel: PublicProduct = {
  id: "11111111-1111-4111-8111-111111111111", sku: "TECH-PANEL", slug: "technical-only",
  name: "Техническая фактура для проверки длинного названия и корректного переноса строки",
  series: null, priceMinor: 200000, currency: "RUB", priceUnit: "м²", saleUnit: "sheet",
  minQuantity: 1, quantityStep: 1, areaPerSaleUnitM2: 4.0328, sourcePriceRange: null,
  availabilityStatus: "in_stock", isFeatured: false, sortOrder: 0, categories: [], primaryImage: null,
};
const accessory: PublicProduct = {
  ...panel, id: "22222222-2222-4222-8222-222222222222", name: "Технический аксессуар",
  sku: "TECH-ACCESSORY", priceMinor: 160000, priceUnit: "шт./упаковка", saleUnit: "шт./упаковка",
  areaPerSaleUnitM2: null,
};
const unavailable: PublicProduct = { ...accessory, id: "33333333-3333-4333-8333-333333333333", name: "Техническая недоступная позиция", availabilityStatus: null };
const changedRule: PublicProduct = { ...panel, id: "44444444-4444-4444-8444-444444444444", name: "Техническая позиция с новым шагом", minQuantity: 2, quantityStep: 2 };
const scenarios = ["Готовые позиции", "Изменилась цена", "Изменилась единица", "Новый шаг количества",
  "Недоступная позиция", "Отсутствующая позиция", "Hydration", "Загрузка", "Ошибка проверки", "Пустая корзина"] as const;
type Scenario = typeof scenarios[number];
function fixture(which: Scenario): { products: PublicProduct[]; lines: CartLine[]; phase: CartPhase } {
  const first: CartLine = { productId: panel.id, quantity: 3, snapshot: currentSnapshot(panel) };
  switch (which) {
    case "Готовые позиции": return { products: [panel, accessory], lines: [first,
      { productId: accessory.id, quantity: 1, snapshot: currentSnapshot(accessory) }], phase: "ready" };
    case "Изменилась цена": return { products: [panel], lines: [{ ...first, snapshot: { ...first.snapshot, priceMinor: 190000 } }], phase: "ready" };
    case "Изменилась единица": return { products: [panel], lines: [{ ...first, snapshot: { ...first.snapshot, priceUnit: "шт./упаковка", saleUnit: "шт./упаковка" } }], phase: "ready" };
    case "Новый шаг количества": return { products: [changedRule], lines: [{ productId: changedRule.id, quantity: 3, snapshot: currentSnapshot(changedRule) }], phase: "ready" };
    case "Недоступная позиция": return { products: [unavailable], lines: [{ productId: unavailable.id, quantity: 1, snapshot: currentSnapshot(unavailable) }], phase: "ready" };
    case "Отсутствующая позиция": return { products: [], lines: [{ productId: "55555555-5555-4555-8555-555555555555", quantity: 1,
      snapshot: { name: "Техническая строка из устаревшего снимка", priceMinor: 100 } }], phase: "ready" };
    case "Hydration": return { products: [], lines: [first], phase: "hydrating" };
    case "Загрузка": return { products: [], lines: [first], phase: "refreshing" };
    case "Ошибка проверки": return { products: [], lines: [first], phase: "error" };
    case "Пустая корзина": return { products: [], lines: [], phase: "empty" };
  }
}

export function TechnicalCartReview({ realAzurId }: { realAzurId: string | null }) {
  const [scenario, setScenario] = useState<Scenario>(scenarios[0]);
  const [state, setState] = useState<CartState>({ version: CART_VERSION, lines: fixture(scenarios[0]).lines });
  const [phase, setPhase] = useState<CartPhase>("ready");
  const selected = fixture(scenario);
  return <section className={styles.review}>
    <p className={styles.eyebrow}>TECHNICAL CART PAGE REVIEW — NOT REAL CART DATA</p>
    <h1>Состояния корзины</h1>
    <p>Сценарии ниже используют только синтетические props. Отдельная кнопка REAL Азур временно записывает только browser storage; Supabase не изменяется.</p>
    <div className={styles.controls}>{realAzurId && <button type="button" onClick={() => {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: CART_VERSION,
        lines: [{ productId: realAzurId, quantity: 1 }] }));
      window.location.assign(new URL("/cart", window.location.href).toString());
    }}>Проверить REAL Азур в локальной корзине (только browser storage)</button>}
    <button type="button" onClick={() => { window.localStorage.removeItem(CART_STORAGE_KEY); window.location.reload(); }}>
      Очистить технические строки browser storage
    </button></div>
    <label className={styles.label} htmlFor="technical-scenario">Состояние</label>
    <select id="technical-scenario" value={scenario} onChange={(event) => {
      const next = event.target.value as Scenario; setScenario(next);
      setState({ version: CART_VERSION, lines: fixture(next).lines }); setPhase(fixture(next).phase);
    }} className={styles.select}>
      {scenarios.map((name) => <option key={name}>{name}</option>)}
    </select>
    <CartContent technical lines={state.lines} products={selected.products} phase={state.lines.length ? phase : "empty"}
      onRetry={() => { setScenario("Готовые позиции"); setState({ version: CART_VERSION, lines: fixture("Готовые позиции").lines }); setPhase("ready"); }}
      onRemove={(id) => setState((current) => removeLine(current, id).state)}
      onUpdate={(id, quantity, rule) => setState((current) => updateQuantity(current, id, quantity, rule).state)}
      onConfirm={(product, model, quantity) => setState((current) => upsertLine(current,
        { productId: product.id, quantity, snapshot: currentSnapshot(product) }, model).state)} />
  </section>;
}

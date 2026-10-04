"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart/CartProvider";
import { currentSnapshot, reconcileLines } from "@/lib/cart/reconcile";
import { evaluateCommerce } from "@/lib/catalog/commerce";
import { TECHNICAL_FLOW_CONTACT, TECHNICAL_FLOW_KEYS, TECHNICAL_FLOW_PRODUCT } from "@/lib/orders/technical-flow-fixture";
import type { PublicProduct } from "@/lib/catalog/types";
import { QuantityBlock } from "../product/[slug]/QuantityBlock";
import { CartContent } from "../cart/CartContent";
import { CheckoutContent } from "../checkout/CheckoutContent";
import { refreshTechnicalFlowProduct } from "./actions";
import styles from "./review.module.css";

const product = TECHNICAL_FLOW_PRODUCT;
const model = evaluateCommerce(product, true)!;
const missingId = "5eac6bd1-c61b-4716-b5ac-56cbadcc2787";
const realKey = "ba6fa7b5-0b66-4a80-b760-eebd380246d9";
const missingKey = "9c2cd4b4-cf43-4354-b3e3-8d76d97423e0";
type Stage = "product" | "cart" | "checkout" | "success";
type OrderPayload = {
  version: 1; idempotency_key: string; name: string; phone: string; city: string; email: string;
  comment: string; items: { product_id: string; quantity: number; price_minor: number;
    price_unit: string; sale_unit: string }[];
};

function payload(key: string, productId: string, quantity: number): OrderPayload {
  return {
    version: 1, idempotency_key: key, ...TECHNICAL_FLOW_CONTACT,
    items: [{ product_id: productId, quantity, price_minor: product.priceMinor!,
      price_unit: product.priceUnit!, sale_unit: product.saleUnit! }],
  };
}

async function postOrder(body: OrderPayload) {
  const response = await fetch("/api/order-requests", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body), cache: "no-store",
  });
  const result: unknown = await response.json();
  const data = result && typeof result === "object" ? result as Record<string, unknown> : {};
  return { status: response.status, id: typeof data.request_id === "string" ? data.request_id : null,
    code: typeof data.code === "string" ? data.code : null, replayed: data.replayed === true };
}

export function ReviewClient({ azurId }: { azurId: string | null }) {
  const { state, hydrationStatus, upsert, update, remove } = useCart();
  const [stage, setStage] = useState<Stage>("product");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [replay, setReplay] = useState<string | null>(null);
  const [diagnostic, setDiagnostic] = useState<string | null>(null);
  const [loseResponse, setLoseResponse] = useState(false);
  const [hasRetainedPayload, setHasRetainedPayload] = useState(false);
  const [refreshAttempt, setRefreshAttempt] = useState(0);
  const [refresh, setRefresh] = useState<{ key: string; products: PublicProduct[]; error: boolean } | null>(null);
  const retainedPayload = useRef<OrderPayload | null>(null);
  const lines = state.lines.filter((line) => line.productId === product.id);
  const idsKey = JSON.stringify(lines.map((line) => line.productId));
  const refreshKey = `${idsKey}:${refreshAttempt}`;
  useEffect(() => {
    if (hydrationStatus !== "ready" || idsKey === "[]") return;
    let active = true;
    refreshTechnicalFlowProduct(JSON.parse(idsKey))
      .then((products) => { if (active) setRefresh({ key: refreshKey, products, error: false }); })
      .catch(() => { if (active) setRefresh({ key: refreshKey, products: [], error: true }); });
    return () => { active = false; };
  }, [hydrationStatus, idsKey, refreshKey]);
  const phase = hydrationStatus !== "ready" ? "hydrating" : !lines.length ? "empty"
    : refresh?.key !== refreshKey ? "refreshing" : refresh.error ? "error" : "ready";
  const products = phase === "ready" ? refresh!.products : [];
  const ready = phase === "ready" && reconcileLines(lines, products).totalMinor !== null;

  async function submit(body: OrderPayload, simulateLoss: boolean) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    retainedPayload.current = body;
    setHasRetainedPayload(true);
    try {
      const result = await postOrder(body);
      if (simulateLoss && result.id) {
        setError("Техническая имитация потери ответа после серверной записи. Корзина сохранена; повтор использует тот же ключ.");
        return;
      }
      if (result.id && (result.status === 200 || result.status === 201)) {
        setRequestId(result.id);
        setReplay(result.replayed ? "Повтор вернул прежний ID; новая заявка не создавалась." : null);
        remove(product.id); // Only after a confirmed successful response.
        setStage("success");
      } else {
        setError(result.status === 409 ? `Проверка корзины: ${result.code ?? "изменились данные"}. Вернитесь в корзину.`
          : "Ответ не подтверждает создание заявки. Корзина сохранена; повторите с тем же ключом.");
      }
    } catch {
      setError("Сетевой ответ не получен. Корзина сохранена; повторите с тем же ключом.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function diagnosticPost(kind: "price" | "unit" | "quantity" | "missing" | "real") {
    if (busyRef.current) return;
    const key = kind === "price" ? TECHNICAL_FLOW_KEYS.changedPrice
      : kind === "unit" ? TECHNICAL_FLOW_KEYS.changedUnit
        : kind === "quantity" ? TECHNICAL_FLOW_KEYS.invalidQuantity
          : kind === "missing" ? missingKey : realKey;
    const body = payload(key, kind === "missing" ? missingId : kind === "real" ? azurId! : product.id,
      kind === "quantity" ? 2 : 3);
    if (kind === "price") body.items[0].price_minor = product.priceMinor! + 100;
    if (kind === "unit") body.items[0].price_unit = "шт.";
    busyRef.current = true;
    setBusy(true);
    try {
      const result = await postOrder(body);
      setDiagnostic(`${kind}: HTTP ${result.status} ${result.code ?? "без кода"}; request ID ${result.id ? "появился — FAIL" : "отсутствует"}.`);
    } catch { setDiagnostic(`${kind}: network error; повторите проверку.`); }
    finally { busyRef.current = false; setBusy(false); }
  }

  return <div className={styles.review}>
    <nav className={styles.stages} aria-label="Этапы технической проверки">
      <button type="button" onClick={() => setStage("product")}>1. Product-like entry</button>
      <button type="button" onClick={() => setStage("cart")}>2. Корзина</button>
      <button type="button" onClick={() => setStage("checkout")}>3. Заявка</button>
    </nav>
    {stage === "product" && <section className={styles.panel}>
      <h2>{product.name}</h2><p>SKU: {product.sku} · 2 000 ₽ / м² · единица продажи: лист</p>
      <QuantityBlock model={model} productId={product.id} snapshot={currentSnapshot(product)} />
      <p>Выберите 3 листа (минимум 1, шаг 2) для контрольного точного итога 24 196,80 ₽. Повторный Add сохраняет одну позицию.</p>
      <button type="button" className={styles.next} onClick={() => setStage("cart")}>Посмотреть корзину</button>
    </section>}
    {stage === "cart" && <div className={styles.panel}>
      <h2>Техническая корзина · CartContent</h2>
      <CartContent lines={lines} products={products} phase={phase} technical
        onRetry={() => setRefreshAttempt((value) => value + 1)} onUpdate={update} onRemove={remove}
        onConfirm={(current, currentModel, quantity) => upsert(current.id, quantity, currentModel, currentSnapshot(current))} />
      {ready && <button type="button" className={styles.next} onClick={() => setStage("checkout")}>Перейти к технической заявке</button>}
    </div>}
    {stage === "checkout" && <div className={styles.panel}>
      <h2>Техническая заявка · CheckoutContent</h2>
      <CheckoutContent lines={lines} products={products} phase={phase} technical
        technicalInitialValues={{ ...TECHNICAL_FLOW_CONTACT }} technicalSubmitting={busy}
        technicalError={error ?? undefined}
        onTechnicalSubmit={async () => {
          if (!ready || !lines[0] || !products[0]) return;
          // Form validation runs in CheckoutForm; the wire payload always uses fixed synthetic contacts.
          const current = products[0];
          const body = payload(TECHNICAL_FLOW_KEYS.positive, current.id, lines[0].quantity);
          body.items[0].price_minor = current.priceMinor!;
          body.items[0].price_unit = current.priceUnit!;
          body.items[0].sale_unit = current.saleUnit!;
          await submit(body, loseResponse);
        }} />
      {ready && <label className={styles.option}><input type="checkbox" checked={loseResponse}
        onChange={(event) => setLoseResponse(event.target.checked)} /> Имитировать потерю ответа после первой записи</label>}
      {error && hasRetainedPayload && <button type="button" className={styles.next} disabled={busy}
        onClick={() => void submit(retainedPayload.current!, false)}>Повторить ту же заявку с тем же ключом</button>}
      {error && <p><Link href="/cart">Обычная корзина</Link> · <button type="button" onClick={() => setStage("cart")}>Техническая корзина</button></p>}
    </div>}
    {stage === "success" && <div className={styles.panel} role="status">
      <h2>Тестовая заявка отправлена</h2>
      <p>ID заявки: <strong>{requestId}</strong></p>
      <p>Данные синтетические. Это запрос менеджеру, без резерва, оплаты и подтверждения заказа.</p>
      <p>Техническая корзина очищена только после успешного ответа.</p>
      <button type="button" className={styles.next} disabled={busy || !hasRetainedPayload}
        onClick={async () => {
          if (!retainedPayload.current || busyRef.current) return;
          busyRef.current = true; setBusy(true);
          try {
            const response = await postOrder(retainedPayload.current);
            setReplay(response.id === requestId && response.replayed
              ? "Повтор вернул прежний ID; новая заявка и уведомление не создавались."
              : `Повтор: HTTP ${response.status}; проверьте результат.`);
          } catch { setReplay("Ответ не получен. Повторите с тем же ключом."); }
          finally { busyRef.current = false; setBusy(false); }
        }}>Проверить idempotent replay</button>
      {replay && <p role="status">{replay}</p>}
    </div>}
    <section className={styles.diagnostics} aria-labelledby="t055-negative-title">
      <h2 id="t055-negative-title">Негативные проверки · без вставки</h2>
      <div className={styles.buttons}>
        <button type="button" disabled={busy} onClick={() => void diagnosticPost("price")}>Изменённая цена</button>
        <button type="button" disabled={busy} onClick={() => void diagnosticPost("unit")}>Изменённая единица</button>
        <button type="button" disabled={busy} onClick={() => void diagnosticPost("quantity")}>Неверное количество</button>
        <button type="button" disabled={busy} onClick={() => void diagnosticPost("missing")}>Отсутствующий товар</button>
        <button type="button" disabled={busy || !azurId} onClick={() => void diagnosticPost("real")}>REAL Азур · availability NULL</button>
      </div>
      {diagnostic && <p role="status">{diagnostic}</p>}
      <p>Обычные <Link href="/cart">/cart</Link> и <Link href="/checkout">/checkout</Link> остаются под public guest/RLS и legal gate.</p>
    </section>
  </div>;
}

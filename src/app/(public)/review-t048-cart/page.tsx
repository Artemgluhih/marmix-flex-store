"use client";

import { StrictMode } from "react";
import { CartProvider, useCart } from "@/lib/cart/CartProvider";
import { CART_STORAGE_KEY } from "@/lib/cart/storage";

const rule = { min: 1, step: 1, max: 9999 };

function Review() {
  const { state, hydrationStatus, storageStatus, upsert, update, remove } = useCart();
  return <main style={{ maxWidth: 700, margin: "6rem auto", padding: "1.5rem", color: "#f5f1e8" }}>
    <h1>TECHNICAL CART HYDRATION REVIEW — NOT REAL CART UI</h1>
    <p>Hydration: <output data-testid="hydration">{hydrationStatus}</output></p>
    <p>Storage: <output data-testid="recovery">{storageStatus}</output></p>
    <p>Lines: <output data-testid="lines">{state.lines.map((line) => `${line.productId}:${line.quantity}`).join(",") || "empty"}</output></p>
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <button type="button" disabled={hydrationStatus !== "ready"} onClick={() => upsert("synthetic-a", 3, rule, { name: "Technical A", priceMinor: 0 })}>Set A = 3</button>
      <button type="button" disabled={hydrationStatus !== "ready"} onClick={() => upsert("synthetic-b", 2, rule)}>Set B = 2</button>
      <button type="button" disabled={hydrationStatus !== "ready"} onClick={() => update("synthetic-a", 4, rule)}>Update A = 4</button>
      <button type="button" disabled={hydrationStatus !== "ready"} onClick={() => remove("synthetic-a")}>Remove A</button>
      <button type="button" onClick={() => { window.localStorage.setItem(CART_STORAGE_KEY, "{"); window.location.reload(); }}>Inject corrupt + reload</button>
      <button type="button" onClick={() => { window.localStorage.setItem(CART_STORAGE_KEY, '{"version":99,"lines":[]}'); window.location.reload(); }}>Inject unknown version + reload</button>
      <button type="button" onClick={() => window.location.reload()}>Reload</button>
    </div>
  </main>;
}

export default function TechnicalCartReview() {
  return <StrictMode><CartProvider><Review /></CartProvider></StrictMode>;
}

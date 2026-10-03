"use client";

import { useEffect, useState } from "react";
import { refreshCartProducts } from "@/app/(public)/cart/actions";
import type { PublicProduct } from "@/lib/catalog/types";
import type { CartLine } from "./model";

export type CartRefreshPhase = "hydrating" | "empty" | "refreshing" | "error" | "ready";
type Refresh = { key: string; products: PublicProduct[]; error: boolean };

export function useFreshCartProducts(lines: readonly CartLine[], hydrationStatus: "hydrating" | "ready") {
  const [attempt, setAttempt] = useState(0);
  const [refresh, setRefresh] = useState<Refresh | null>(null);
  const idsKey = JSON.stringify(lines.map((line) => line.productId));
  const key = `${idsKey}:${attempt}`;

  useEffect(() => {
    if (hydrationStatus !== "ready" || idsKey === "[]") return;
    let active = true;
    refreshCartProducts(JSON.parse(idsKey))
      .then((products) => { if (active) setRefresh({ key, products, error: false }); })
      .catch(() => { if (active) setRefresh({ key, products: [], error: true }); });
    return () => { active = false; };
  }, [hydrationStatus, idsKey, key]);

  const phase: CartRefreshPhase = hydrationStatus !== "ready" ? "hydrating" :
    !lines.length ? "empty" : refresh?.key !== key ? "refreshing" : refresh.error ? "error" : "ready";
  return { products: phase === "ready" ? refresh!.products : [], phase, retry: () => setAttempt((value) => value + 1) };
}

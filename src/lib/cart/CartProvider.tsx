"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { EMPTY_CART, removeLine, updateQuantity, upsertLine,
  type CartDisplaySnapshot, type CartQuantityRule, type CartState } from "./model";
import { readCart, writeCart, type CartStorage } from "./storage";
import { trackMetrikaCartGoal } from "@/lib/analytics/metrika";

type CartContextValue = {
  state: CartState;
  hydrationStatus: "hydrating" | "ready";
  storageStatus: "none" | "storage_recovered" | "storage_unavailable";
  upsert: (productId: string, targetQuantity: number, rule: CartQuantityRule, snapshot?: CartDisplaySnapshot) => void;
  update: (productId: string, targetQuantity: number, rule: CartQuantityRule) => void;
  remove: (productId: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function browserStorage(): CartStorage | null {
  try { return window.localStorage; }
  catch { return null; }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(EMPTY_CART);
  // Synchronous command state prevents two rapid clicks from observing the same stale render.
  const stateRef = useRef<CartState>(EMPTY_CART);
  const [hydrationStatus, setHydrationStatus] = useState<"hydrating" | "ready">("hydrating");
  const [storageStatus, setStorageStatus] = useState<CartContextValue["storageStatus"]>("none");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const loaded = readCart(browserStorage());
      stateRef.current = loaded.state;
      setState(loaded.state);
      setStorageStatus(loaded.recovery);
      setHydrationStatus("ready");
    });
    return () => { active = false; }; // StrictMode replay cannot apply a stale read.
  }, []);

  useEffect(() => {
    if (hydrationStatus !== "ready") return; // Never write EMPTY_CART before reading storage.
    if (!writeCart(browserStorage(), state)) {
      queueMicrotask(() => setStorageStatus("storage_unavailable"));
    }
  }, [hydrationStatus, state]);

  const ready = hydrationStatus === "ready";
  const value: CartContextValue = {
    state, hydrationStatus, storageStatus,
    upsert: (productId, targetQuantity, rule, snapshot) => {
      if (!ready) return;
      const before = stateRef.current;
      const result = upsertLine(before, { productId, quantity: targetQuantity, snapshot }, rule);
      if (!result.ok || !result.changed) return;
      stateRef.current = result.state;
      setState(result.state);
      if (!before.lines.some((line) => line.productId === productId)) trackMetrikaCartGoal("add_to_cart");
    },
    update: (productId, targetQuantity, rule) => {
      if (!ready) return;
      const result = updateQuantity(stateRef.current, productId, targetQuantity, rule);
      if (!result.ok || !result.changed) return;
      stateRef.current = result.state;
      setState(result.state);
    },
    remove: (productId) => {
      if (!ready) return;
      const result = removeLine(stateRef.current, productId);
      if (!result.ok || !result.changed) return;
      stateRef.current = result.state;
      setState(result.state);
      trackMetrikaCartGoal("remove_from_cart");
    },
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart requires CartProvider");
  return context;
}

"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { EMPTY_CART, removeLine, updateQuantity, upsertLine,
  type CartDisplaySnapshot, type CartQuantityRule, type CartState } from "./model";
import { readCart, writeCart, type CartStorage } from "./storage";

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
  const [hydrationStatus, setHydrationStatus] = useState<"hydrating" | "ready">("hydrating");
  const [storageStatus, setStorageStatus] = useState<CartContextValue["storageStatus"]>("none");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const loaded = readCart(browserStorage());
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
      if (ready) setState((current) => upsertLine(current, { productId, quantity: targetQuantity, snapshot }, rule).state);
    },
    update: (productId, targetQuantity, rule) => {
      if (ready) setState((current) => updateQuantity(current, productId, targetQuantity, rule).state);
    },
    remove: (productId) => {
      if (ready) setState((current) => removeLine(current, productId).state);
    },
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart requires CartProvider");
  return context;
}

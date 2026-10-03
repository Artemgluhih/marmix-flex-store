"use client";

import { useCart } from "@/lib/cart/CartProvider";
import { useFreshCartProducts } from "@/lib/cart/useFreshCartProducts";
import { CheckoutContent } from "./CheckoutContent";

export function CheckoutPageClient() {
  const { state, hydrationStatus } = useCart();
  const { products, phase } = useFreshCartProducts(state.lines, hydrationStatus);
  return <CheckoutContent lines={state.lines} products={products} phase={phase} />;
}

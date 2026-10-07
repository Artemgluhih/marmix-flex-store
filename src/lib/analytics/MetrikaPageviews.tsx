"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createMetrikaAdapter } from "./metrika";

let adapter: ReturnType<typeof createMetrikaAdapter> | null = null;
let activeCounterId: number | null = null;

export function MetrikaPageviews({ counterId }: { counterId: number }) {
  const pathname = usePathname();

  useEffect(() => {
    if (activeCounterId !== counterId) {
      adapter = createMetrikaAdapter(counterId);
      activeCounterId = counterId;
    }
    adapter?.start(window, document);
    adapter?.pageview(pathname, window);
  }, [counterId, pathname]);

  return null;
}

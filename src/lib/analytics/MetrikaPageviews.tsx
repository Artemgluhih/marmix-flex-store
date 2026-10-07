"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackMetrikaPageview } from "./metrika";

export function MetrikaPageviews({ counterId }: { counterId: number }) {
  const pathname = usePathname();

  useEffect(() => {
    trackMetrikaPageview(counterId, pathname, window, document);
  }, [counterId, pathname]);

  return null;
}

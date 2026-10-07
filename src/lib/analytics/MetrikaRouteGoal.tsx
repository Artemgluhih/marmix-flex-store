"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackMetrikaRouteGoal, type RouteGoal } from "./metrika";

export function MetrikaRouteGoal({ name, path }: { name: RouteGoal; path: string }) {
  const pathname = usePathname();
  useEffect(() => {
    // The server only renders this marker after its public catalog/product read succeeds.
    if (pathname === path) trackMetrikaRouteGoal(name, path);
  }, [name, path, pathname]);
  return null;
}

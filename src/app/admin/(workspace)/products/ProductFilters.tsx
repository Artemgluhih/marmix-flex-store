"use client";

import { useEffect, useRef, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { productFilterHref } from "./filter-url";
import styles from "./products.module.css";
import workflow from "./workflow.module.css";

export function ProductFilters({ children }: { children: ReactNode }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, startTransition] = useTransition();
  function cancel() {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }
  useEffect(() => () => { if (timer.current !== null) clearTimeout(timer.current); }, []);
  function apply(form: HTMLFormElement) {
    cancel();
    const values = new URLSearchParams();
    new FormData(form).forEach((value, key) => { if (typeof value === "string") values.set(key, value); });
    startTransition(() => router.push(productFilterHref(values), { scroll: false }));
  }
  return <>
    <form className={styles.filters} action="/admin/products" method="get" role="search" aria-busy={pending}
      onSubmit={(event) => { event.preventDefault(); apply(event.currentTarget); }}
      onChange={(event) => {
        cancel();
        const form = event.currentTarget;
        if (event.target instanceof HTMLInputElement && event.target.name === "q") {
          timer.current = setTimeout(() => apply(form), 400);
        } else apply(form);
      }}>
      {children}
    </form>
    <p className={workflow.filterPending} role="status" aria-live="polite">{pending ? "Обновляем список товаров…" : ""}</p>
  </>;
}

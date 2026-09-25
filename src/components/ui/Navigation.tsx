"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./Navigation.module.css";

const links = [
  { href: "/#materials", label: "Материал" },
  { href: "/catalog", label: "Каталог" },
  { href: "/applications", label: "В интерьере" },
  { href: "/contacts", label: "Контакт" },
] as const;

export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const main = document.getElementById("public-main");
    const footer = document.getElementById("public-footer");
    const brand = document.getElementById("public-brand");
    const toggle = toggleRef.current;
    const background = [main, footer, brand].filter((node): node is HTMLElement => node !== null);
    const previousInert = background.map((node) => node.inert);
    const previousOverflow = document.body.style.overflow;

    background.forEach((node) => { node.inert = true; });
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }

      if (event.key === "Tab") {
        const first = toggleRef.current;
        const last = panelRef.current?.querySelector<HTMLAnchorElement>("a:last-child");
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    function onResize() {
      if (window.innerWidth > 800) setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      background.forEach((node, index) => { node.inert = previousInert[index]; });
      document.body.style.overflow = previousOverflow;
      toggle?.focus();
    };
  }, [open]);

  const current = (href: string) => href !== "/#materials" && (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <>
      <nav className={styles.desktop} aria-label="Основная навигация">
        {links.map(({ href, label }) => (
          <Link key={href} href={href} aria-current={current(href) ? "page" : undefined}>{label}</Link>
        ))}
      </nav>
      <button
        ref={toggleRef}
        className={styles.toggle}
        type="button"
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        aria-controls="mobile-navigation"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span /><span />
      </button>
      {open && <button className={styles.scrim} type="button" aria-label="Закрыть меню" onClick={() => setOpen(false)} tabIndex={-1} />}
      <div ref={panelRef} id="mobile-navigation" className={styles.panel} role="dialog" aria-modal="true" aria-label="Меню" hidden={!open}>
        <nav aria-label="Мобильная навигация">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} aria-current={current(href) ? "page" : undefined} onClick={() => setOpen(false)}>{label}</Link>
          ))}
        </nav>
      </div>
    </>
  );
}

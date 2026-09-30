"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { logoutAction } from "@/app/admin/login/actions";
import styles from "./admin-shell.module.css";

const sections = [
  { label: "Обзор", href: "/admin" },
  { label: "Товары" },
  { label: "Категории" },
  { label: "Заявки" },
] as const;

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link href="/admin" onClick={onNavigate} className={styles.brand} aria-label="Marmix Flex — панель управления">
      <span className={styles.brandName}>MARMIX <span>FLEX</span></span>
      <span className={styles.brandCaption}>Панель управления</span>
    </Link>
  );
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Разделы панели управления" className={styles.navigation}>
      <span className={styles.navCaption}>Рабочие разделы</span>
      {sections.map((section, index) => {
        const active = "href" in section &&
          (section.href === "/admin" ? pathname === "/admin" : pathname.startsWith(section.href));
        return "href" in section ? (
          <Link
            href={section.href}
            key={section.label}
            aria-current={active ? "page" : undefined}
            className={`${styles.navItem} ${active ? styles.navActive : ""}`}
            onClick={onNavigate}
          >
            <span className={styles.navIndex}>0{index + 1}</span>
            <span>{section.label}</span>
          </Link>
        ) : (
          <span className={styles.navPending} key={section.label}>
            <span className={styles.navIndex}>0{index + 1}</span>
            <span>{section.label}</span>
            <span className={styles.pendingLabel}>Скоро</span>
          </span>
        );
      })}
    </nav>
  );
}

function SecondaryActions({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className={styles.secondaryActions}>
      <Link href="/" prefetch={false} onClick={onNavigate} className={styles.siteLink}>
        Перейти на сайт <span aria-hidden="true">↗</span>
      </Link>
      <form action={logoutAction}>
        <button type="submit" className={styles.logout}>Выйти из панели</button>
      </form>
    </div>
  );
}

function MobileMenu() {
  // The keyed component remounts closed after client-side route changes.
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className={styles.mobileMenu}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.menuTrigger}
        aria-label="Открыть меню панели"
        aria-expanded={open}
        aria-controls="admin-mobile-drawer"
        onClick={() => setOpen(true)}
      >
        <span className={styles.menuLines} aria-hidden="true"><span /><span /></span>
        Меню
      </button>
      {open && (
        <div className={styles.mobileOverlay}>
          <button type="button" className={styles.backdrop} aria-label="Закрыть меню" onClick={closeMenu} tabIndex={-1} />
          <div
            id="admin-mobile-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Меню панели управления"
            className={styles.drawer}
          >
            <div className={styles.drawerTop}>
              <Brand onNavigate={closeMenu} />
              <button ref={closeRef} type="button" className={styles.closeButton} aria-label="Закрыть меню" onClick={closeMenu}>×</button>
            </div>
            <Navigation onNavigate={closeMenu} />
            <SecondaryActions onNavigate={closeMenu} />
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Панель управления">
        <Brand />
        <Navigation />
        <SecondaryActions />
      </aside>
      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div className={styles.topbarIdentity}>
            <span className={styles.topbarMarker} aria-hidden="true" />
            <span>Администрирование</span>
          </div>
          <div className={styles.topbarActions}>
            <Link href="/" prefetch={false} className={styles.topbarSiteLink}>Перейти на сайт <span aria-hidden="true">↗</span></Link>
            <MobileMenu key={pathname} />
          </div>
        </header>
        <main id="admin-content" className={styles.main}>{children}</main>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState, type MouseEvent, type ReactNode } from "react";
import { createBeginCheckoutAction } from "./actions";
import { trackMetrikaActionGoal } from "./metrika";

type Props = { children: ReactNode; className?: string };

export function TrackedCheckoutLink({ children, className }: Props) {
  const [action] = useState(createBeginCheckoutAction);
  return <Link href="/checkout" className={className} onClick={(event) => {
    if (!event.defaultPrevented) action();
  }}>{children}</Link>;
}

export function TrackedContactLink({ children, className, onClick, ariaCurrent }: Props & {
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  ariaCurrent?: "page";
}) {
  return <Link href="/contacts" className={className} aria-current={ariaCurrent} onClick={(event) => {
    onClick?.(event);
    if (!event.defaultPrevented) trackMetrikaActionGoal("contact_click");
  }}>{children}</Link>;
}

export function TrackedPhoneLink({ children, className, href }: Props & { href: `tel:${string}` }) {
  return <a href={href} className={className} onClick={(event) => {
    if (!event.defaultPrevented) trackMetrikaActionGoal("phone_click");
  }}>{children}</a>;
}

"use client";

import { useEffect } from "react";

export function MotionReveal() {
  useEffect(() => {
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!targets.length) return;

    // Already visible content must never disappear when hydration completes.
    const belowFold = targets.filter((target) => {
      if (target.getBoundingClientRect().top <= window.innerHeight + 50) {
        target.classList.add("is-visible");
        return false;
      }
      return true;
    });

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08, rootMargin: "0px 0px 50px 0px" });

    belowFold.forEach((target) => observer.observe(target));
    document.documentElement.classList.add("motion-ready");

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    function onPreferenceChange() {
      if (!reducedMotion.matches) return;
      observer.disconnect();
      document.documentElement.classList.remove("motion-ready");
      targets.forEach((target) => target.classList.add("is-visible"));
    }

    reducedMotion.addEventListener("change", onPreferenceChange);
    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener("change", onPreferenceChange);
      document.documentElement.classList.remove("motion-ready");
    };
  }, []);

  return null;
}

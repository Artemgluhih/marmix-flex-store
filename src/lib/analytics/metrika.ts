type MetrikaCall = [number, "init" | "hit" | "reachGoal", ...unknown[]];

export type MetrikaGoal = "catalog_view" | "product_view" | "add_to_cart" | "remove_from_cart";
export type RouteGoal = Extract<MetrikaGoal, "catalog_view" | "product_view">;
const GOALS = new Set<MetrikaGoal>(["catalog_view", "product_view", "add_to_cart", "remove_from_cart"]);

export type MetrikaFunction = ((...args: MetrikaCall) => void) & {
  a?: MetrikaCall[];
  l?: number;
};

type MetrikaWindow = Window & { ym?: MetrikaFunction };

const TAG_URL = "https://mc.yandex.ru/metrika/tag.js";
const STATIC_PATHS = new Set([
  "/", "/catalog", "/cart", "/checkout", "/about", "/applications",
  "/contacts", "/delivery", "/privacy", "/terms",
]);

export function productionCounterId(environment: string | undefined, rawId: string | undefined): number | null {
  if (environment !== "production" || !rawId || !/^[1-9]\d{0,14}$/.test(rawId)) return null;
  const id = Number(rawId);
  return Number.isSafeInteger(id) ? id : null;
}

// The allowlist also prevents dynamic private identifiers from reaching analytics.
export function publicPageviewPath(pathname: string | null): string | null {
  if (!pathname || !pathname.startsWith("/") || pathname.includes("?") || pathname.includes("#")) return null;
  if (STATIC_PATHS.has(pathname)) return pathname;
  return /^\/(?:product|catalog)\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pathname) ? pathname : null;
}

export function createMetrikaAdapter(counterId: number) {
  let initialized = false;
  let lastTrackedPath: string | null = null;
  let lastGoalPath: string | null = null;

  return {
    start(browser: MetrikaWindow, document: Document): void {
      if (initialized || !Number.isSafeInteger(counterId) || counterId <= 0) return;
      initialized = true;

      // Official async queue shape: init and hits wait for the external tag.
      if (!browser.ym) {
        const queued = ((...args: MetrikaCall) => { queued.a?.push(args); }) as MetrikaFunction;
        queued.a = [];
        queued.l = Date.now();
        browser.ym = queued;
      }
      browser.ym(counterId, "init", {
        defer: true,
        clickmap: false,
        trackLinks: false,
        trackHash: false,
        webvisor: false,
        ecommerce: false,
        sendTitle: false,
      });

      if (!document.getElementById("marmix-metrika-script")) {
        const script = document.createElement("script");
        script.id = "marmix-metrika-script";
        script.async = true;
        script.src = TAG_URL;
        document.head.appendChild(script);
      }
    },

    pageview(pathname: string | null, browser: MetrikaWindow): void {
      const path = publicPageviewPath(pathname);
      if (!initialized || !path || path === lastTrackedPath || !browser.ym) return;
      const referer = lastTrackedPath;
      lastTrackedPath = path;
      if (lastGoalPath !== path) lastGoalPath = null;
      browser.ym(counterId, "hit", path, referer ? { referer } : {});
    },

    goal(name: MetrikaGoal, browser: MetrikaWindow): void {
      if (!initialized || !browser.ym || !GOALS.has(name)) return;
      // No params: no URL, product ID, cart snapshot, search text, or PII.
      browser.ym(counterId, "reachGoal", name);
    },

    routeGoal(name: RouteGoal, pathname: string | null, browser: MetrikaWindow): void {
      const path = publicPageviewPath(pathname);
      if (!initialized || !browser.ym || !path || lastGoalPath === path) return;
      if (name === "catalog_view" ? path !== "/catalog" && !path.startsWith("/catalog/")
        : name !== "product_view" || !path.startsWith("/product/")) return;
      lastGoalPath = path;
      browser.ym(counterId, "reachGoal", name);
    },
  };
}

// Activated only by the production-gated public layout. Preview never starts a counter.
let activeAdapter: ReturnType<typeof createMetrikaAdapter> | null = null;
let activeCounterId: number | null = null;
let pendingRoute: { name: RouteGoal; path: string } | null = null;

export function trackMetrikaPageview(counterId: number, pathname: string | null, browser: MetrikaWindow, document: Document): void {
  if (activeCounterId !== counterId) {
    activeAdapter = createMetrikaAdapter(counterId);
    activeCounterId = counterId;
  }
  activeAdapter?.start(browser, document);
  activeAdapter?.pageview(pathname, browser);
  if (pendingRoute?.path === pathname) activeAdapter?.routeGoal(pendingRoute.name, pathname, browser);
  pendingRoute = null;
}

export function trackMetrikaRouteGoal(name: RouteGoal, pathname: string | null): void {
  if (typeof window === "undefined" || !pathname) return;
  if (!activeAdapter) {
    pendingRoute = { name, path: pathname };
    return;
  }
  activeAdapter.routeGoal(name, pathname, window);
}

export function trackMetrikaCartGoal(name: "add_to_cart" | "remove_from_cart"): void {
  if (typeof window !== "undefined") activeAdapter?.goal(name, window);
}

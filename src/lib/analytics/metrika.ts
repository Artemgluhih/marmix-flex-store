type MetrikaCall = [number, "init" | "hit", ...unknown[]];

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
      browser.ym(counterId, "hit", path, referer ? { referer } : {});
    },
  };
}

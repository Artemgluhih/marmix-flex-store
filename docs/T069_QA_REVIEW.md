# T069 — Public integrated QA review

**Status:** BLOCKED — OWNER PUBLIC INTEGRATED QA VERIFICATION. T069 is not DONE. Review branch only; `redesign-v2`, `main`, Production, Production env and Supabase schema/RLS/data unchanged.

## Live Preview coverage

| Scenario | Evidence | Result |
|---|---|---|
| Homepage → Catalog → published Category → Product | Browser navigation showed three published REAL products, published category links and one Travertine product in its category. Product detail presented stored alt, SKU, confirmed 142 × 284 cm and 4.0328 m², without an invented availability label. | PASS for accessible public path |
| Search/empty/reset/history | Category-filtered search showed zero results, visible empty state and reset preserving category. Back restored the search URL and result; Forward restored the category URL; refresh preserved category URL. | PASS |
| Product routes | `/product/azur`, `/product/travertin-1`, and `/product/klei-dlya-gibkogo-kamnya-bazovii-3-kg` rendered. Missing product/category paths showed 404. | PASS |
| Cart/Checkout | Empty cart and direct empty checkout rendered their safe states. Current REAL products have unconfirmed availability and Add to Cart remains disabled. | PASS for reachable states; positive UI path blocked |
| Other public routes | `/applications`, `/about`, `/delivery`, `/contacts` rendered their expected headings and navigation. | PASS |

## Controlled synthetic coverage (no persistent rows)

- `tests/public-qa-cart.test.cjs`: target quantity and repeat action; exact 24,196.80 RUB synthetic total; localStorage write/read, corrupt/unknown version/duplicate recovery and unavailable storage; stale price/unit, missing/unavailable/invalid quantity, removal and empty state. PASS.
- `tests/order-flow-integration.test.cjs`: form validation, server-prepared snapshot and exact total, wrong quantity/price/unit, missing/unavailable rejection and Preview/Production gate. PASS.
- `tests/order-privacy.test.cjs`, `tests/metrika-actions.test.cjs`: created 201, same-key replay 200, conflict and changed-cart 409, validation 400, response-loss replay first visible goal once, 5xx/network failure false goals 0, private response boundary. PASS.
- `tests/notifications.test.cjs`: created-only Telegram and replay/conflict isolation. The old assertions against the deleted T054A temporary review route were removed; current public API assertions remain and pass.
- T063/T063A category/URL, T064 SEO/indexing, T065 structured data, T066 pageviews, T067/T068 goals targeted harnesses PASS. Preview analytics remains gated in code; no Preview client tracking is enabled.

## Defects and changes

| ID | Reproduction | Expected / actual | Severity | Targeted fix | Regression |
|---|---|---|---|---|---|
| QA-01 | Open Checkout form with eligible cart in controlled UI fixture. | Disabled submit reason should reflect current legal gate; it incorrectly said server processing was not connected, although order API exists. | Minor | Corrected the sentence only; submit stays disabled. | New cart QA assertion and lint/typecheck. |
| QA-02 | Run `node tests/notifications.test.cjs` after T054A cleanup. | Test should run against the current API; it attempted to import the deleted temporary review route and failed with ENOENT. | Minor test harness | Removed only obsolete route assertions; retained created/replay/conflict API assertions. | Targeted notification test passes. |

No critical/major app defect was observed in the accessible paths. Open confirmed app defects: 0. Missing verification is listed separately below.

## Gated or unverified scenarios

- Browser-positive Product → Cart → Checkout → submitted order is **not available**: current REAL products have unconfirmed availability, and permanent Checkout submit remains disabled for legal sign-off. No real order or TEST_ONLY DB product was created; success/retry/idempotency is synthetic only.
- Browser validation with filled Checkout form and an eligible cart is synthetic only. No legal consent text or submission was enabled.
- Exact 360–390, 768, 1024, 1440 and 1920 viewport measurements, horizontal scrollWidth/layout shift, browser console/network waterfall and failed assets could not be captured with the available browser control surface. Desktop screenshot at approximately 1363 px showed no visible overflow on Empty Cart; it does not establish the requested responsive matrix.
- `catalog-public-read.test.cjs` requires a Preview publishable environment absent locally; it was not counted as PASS. Live browser catalog read independently showed three published REAL products and categories. Its old `featured.length === 0` assumption is also stale against the observed homepage Featured set and should be updated before it is used as a strict live-data assertion.
- Local `next build` could not fetch Prata/Manrope from Google Fonts in the sandbox. Vercel Preview build is the authoritative networked build check for this review commit.
- Browser network and console errors, Preview Yandex request count and PII leakage in browser traffic cannot be asserted numerically without a direct network/console capture. Static adapter gates and controlled no-PII tests passed, but these are distinct from live network evidence.

**Production Content Gate:** BLOCKED. **Legal sign-off:** PENDING. **Runtime consent mechanism:** NOT PRESENT. **Permanent Checkout submit:** DISABLED. T070 not started.

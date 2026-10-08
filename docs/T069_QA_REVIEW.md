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

### Browser evidence on the READY review deployment

The browser control surface measured **1363 CSS px** (`innerWidth`), not one of the requested exact widths. At that width, `documentElement.scrollWidth` was 1348–1363 on Homepage, Catalog, Azur Product, Cart, Checkout, Applications, About, Delivery and Contacts: no measured horizontal overflow. Each route had one H1, zero broken completed images, zero `mc.yandex`/Metrika script elements and zero application console errors. The browser logged one Chrome extension metadata error, whose source is `chrome-extension://…/content-script.bundle.js`, outside the application. Keyboard Tab on Contacts focused the skip link then the brand link. These measurements are **not** a responsive PASS for other widths.

| Requested CSS viewport | Layout/overflow | Console/network |
|---|---|---|
| 360, 390, 768, 1024, 1440, 1920 px | UNVERIFIED: browser API cannot set viewport; no local Chromium/agent-browser runner is installed, and package registry access is denied. | UNVERIFIED at those widths. |
| 1363 px (available browser) | No overflow on nine public routes; images completed; basic navigation and focus observed. | Application console errors 0; Metrika script elements 0. Browser API does not expose a network waterfall or resource timing. |

No numerical claim is made for Preview Yandex **network requests**, other failed requests, hydration exceptions outside the captured console, or layout shifts. Static Preview analytics gates and controlled tests are separate evidence.

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
| QA-03 | Run `tests/catalog-public-read.test.cjs` against current published Preview data. | Test expected zero Featured, no category Featured, exactly three fixed prices, and exactly one product per category. These are historical dataset assumptions, while Preview now visibly has three Featured products. | Minor test harness | Replaced fixed values with published catalog contract assertions, Featured cap/order/membership, live list/search/price/detail checks. Missing publishable env now reports UNVERIFIED explicitly. | Source reviewed against `queries.ts`; live harness execution remains unverified because Preview publishable env is unavailable locally. |

No critical/major app defect was observed in the accessible paths. Open confirmed app defects: 0. Missing verification is listed separately below.

## Gated or unverified scenarios

- Browser-positive Product → Cart → Checkout → submitted order is **not available**: current REAL products have unconfirmed availability, and permanent Checkout submit remains disabled for legal sign-off. No real order or TEST_ONLY DB product was created; success/retry/idempotency is synthetic only.
- Browser validation with filled Checkout form and an eligible cart is synthetic only. No legal consent text or submission was enabled.
- Exact 360, 390, 768, 1024, 1440 and 1920 viewport checks remain UNVERIFIED. The available browser measures 1363 CSS px but cannot set viewport; local agent-browser/Chromium is absent and network policy denies package installation. Owner or a runner with viewport control must finish this matrix.
- `catalog-public-read.test.cjs` requires a Preview publishable environment absent locally; it exits UNVERIFIED (2), never PASS. Its stale fixed Featured/category/price assertions have been removed. Live browser independently showed three published REAL and Featured products, but this does not execute the harness against the Supabase client.
- Local `next build` could not fetch Prata/Manrope from Google Fonts in the sandbox. Vercel Preview build is the authoritative networked build check for this review commit.
- The captured browser application console has zero errors on nine public routes at 1363 px. Browser network waterfall, exact failed-request count, Yandex request count and traffic-level PII leakage remain UNVERIFIED; no Metrika script elements were present. Static adapter gates and controlled no-PII tests passed, but these are distinct from live network evidence.

## Review verification after QA-03

- `tests/public-qa-cart.test.cjs`, `tests/notifications.test.cjs`, `tests/order-flow-integration.test.cjs`, `tests/metrika-actions.test.cjs`: PASS.
- Lint and typecheck: PASS.
- Local production build: BLOCKED by sandbox egress to Google Fonts (Manrope/Prata). The networked Vercel build state must be verified for this review SHA; the prior READY deployment does not prove the new commit built.

**Production Content Gate:** BLOCKED. **Legal sign-off:** PENDING. **Runtime consent mechanism:** NOT PRESENT. **Permanent Checkout submit:** DISABLED. T070 not started.

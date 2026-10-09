# T070 — Admin integrated security QA (review)

**Status:** BLOCKED — owner integrated security verification. This is a technical QA review, not an authorization to update `redesign-v2`, Production, schema, RLS or Auth settings. T071 has not started.

## Evidence classes

| Class | Evidence | Result and limit |
|---|---|---|
| LIVE VERIFIED | Anonymous browser on the READY T069 baseline deployment (`0898cd02ef97e529e6aeedb9f850e2c535d8f4b2`): direct `/admin`, `/admin/products`, `/admin/categories`, `/admin/orders`, and an order detail UUID all led to the login form. | Anonymous route denial PASS on the baseline. The T070 review deployment and authenticated Admin browser flow remain separate checks. |
| TRANSACTIONAL VERIFIED | Preview DB, read-only SQL inside `BEGIN`/`ROLLBACK`, `SET LOCAL ROLE`, synthetic non-admin `request.jwt.claim.sub`. | Anon sees 3 published products and 3 categories; order SELECT/INSERT/UPDATE/DELETE grants absent and Storage metadata rows 0. Synthetic non-admin: own membership 0, orders 0, private products 0, private images 0 and Storage metadata 0. An existing active membership impersonated only within the transaction: own active row 1, products 4, categories 3, image rows 3, media objects 3 and orders 0. Order status/note column UPDATE grants exist, snapshot/contact UPDATE and DELETE grants do not. This SQL role simulation is not a signed Auth browser/JWT or direct Data API request. |
| LIVE VERIFIED (configuration) | Preview DB policy catalog. | RLS enabled for `admin_users`, products, categories, product images/memberships, orders and Storage objects. Storage policy is limited to the product-media bucket, `products/<UUID>/<key>.<image extension>` and active membership; no UPDATE policy for upsert. Product/media RPCs are security invoker; order snapshot protection trigger enabled. Policy existence alone does not prove every request path. |
| SYNTHETIC VERIFIED | `tests/admin-security-qa.test.cjs`: exact-origin and redirect matrix, independent read/mutation guard behavior, non-admin/revoked denial, malformed Storage path/file validation and mutation-action guard inventory. Existing `order-actions`, `order-privacy`, `product-workflow`, `category-order` and `order-flow-integration` tests passed. | Mocked clients and code execution only. No claim of live login, direct HTTP mutation or actual Storage upload. |
| LIVE VERIFIED | On READY T070 Preview `5735dc4b58cda1f94015f7122041b61c2f12bed1`, Owner completed sign-in in the cloud browser. Admin overview, Products list, one REAL product editor and its linked media, Categories, and Orders loaded under the same active session. Orders empty state showed 0. Refresh on `/admin/orders` kept the authenticated page. The normal logout returned to `/admin/login`; direct `/admin/orders` after logout returned to login without private order content. | Read-only route and session smoke PASS. No form save, media upload or order mutation occurred. This is not mutation E2E or session-expiry proof. |
| UNVERIFIED | Invalid credentials and signup, timed session expiry/token refresh, separate non-admin and revoked signed Auth accounts, direct authenticated PostgREST mutations, and live signed-session order mutation against a persistent fixture. | The rollback-only order fixture below provides transactional evidence, not signed Auth/browser E2E. The isolated authenticated Storage fixture test is separately documented below; no extra Auth account or persistent product/order fixture was created. |

## Fixture baseline and safety

Before the partial fixture approval, Preview had 4 REAL products, 0 `catalog_kind=TEST_ONLY` products, 0 orders, 3 `product-media` objects and one active Admin membership. The authorized synthetic order existed only within the single rolled-back transaction described below; an independent query confirmed its exact UUID absent afterward. No persistent T070 Auth account, product, category, image, Storage object or order was created. Do not interpret narrow TEST_ONLY counts as a broad scan for every historic test naming convention.

## Security and privacy observations

- Each inspected Admin page invokes `requireAdmin()` independently; mutation action files invoke `requireAdminMutation()`. The guard uses Auth `getUser()` and active own-row membership under the cookie-backed authenticated RLS client. The isolated harness rejects cross-origin before Auth and denies missing, non-admin and revoked contexts.
- Orders list/detail are dynamic, no-store and private by source inspection. Status and note are the only authorized order UPDATE columns; the snapshot trigger is enabled. Existing synthetic order tests cover transition, conflict and public response boundaries. No live order exists in Preview for a T070 detail mutation.
- Storage paths and MIME/size validation pass isolated tests. Bucket/prefix/admin policies are present. The owner-approved live Storage fixture test below verified authenticated upload/delete, upsert rejection, invalid-prefix rejection and effective anonymous mutation denial. The existing Admin media orphan workflow was not exercised against a product; no `product_images` row was created.
- A narrow source scan found no Secret client import in the inspected ordinary Admin actions. No traffic-level PII or browser-bundle secret audit is claimed yet.
- Confirmed security vulnerabilities: none from the checks completed. This is not a claim that the unverified matrix is secure.

## Live browser observations and remaining fixture plan

- Active session route sequence: `/admin` → `/admin/products` → REAL product editor/media → `/admin/categories` → `/admin/orders` (0 rows) → refresh Orders → logout → direct Orders denied. No REAL form values were edited or saved.
- The browser's console exposed repeated `Error sending browser metadata to extension: Object` entries. Their source was the browser extension metadata channel; an app runtime error was not established from those entries. No broad console/network or traffic-level PII claim is made.
- Fixture preflight was **partially approved**: the SQL order transaction was rolled back and independently verified; the one exact Storage object was uploaded, tested and deleted through the authenticated user Admin session on the temporary branch-only QA route. No persistent product/order/Auth fixture is approved or left behind. The sole active Admin membership was not changed. Separate Owner approval remains required for any persistent product/order/Auth fixture.
- Separate signed non-admin/revoked sessions would require safe account provisioning or an existing approved fixture; neither is available. No Auth account or role was created.

## Owner partial fixture approval — transactional order QA (2026-10-08)

Owner authorized one synthetic `public.order_requests` fixture within a single SQL call using explicit `BEGIN` and `ROLLBACK`; no `/api/order-requests` call was made. A read-only role/rollback preflight first confirmed the single-call SQL batch and that a post-rollback query saw 0 orders. Baseline immediately before mutation: REAL products 4, TEST_ONLY products 0, orders 0, Storage objects 3, active Admin memberships 1; exact reserved order UUID had no collision. The fixture used synthetic-only contact values, a nonempty synthetic item snapshot, and a unique idempotency UUID. Neither contact values nor identifiers were sent to analytics or Telegram. Only aggregate assertions, not fixture contact data or Auth identifiers, appear in this report.

| Scope | Observed result | Evidence limit |
|---|---|---|
| Anon role | SELECT, UPDATE, DELETE, INSERT each denied by privilege; no order row exposed. | `SET LOCAL ROLE anon` inside the one DB transaction; not an external HTTP request. |
| Simulated authenticated non-admin | SELECT rows 0; status UPDATE affected 0; INSERT and DELETE denied. | Synthetic nonmember `request.jwt.claim.sub`; not a signed non-admin Auth session. |
| Simulated active Admin | SELECT saw the one fixture; status/internal_note UPDATE affected exactly 1; updated_at advanced and snapshot fields stayed byte-for-byte equivalent as JSON. Name, phone, total, items_snapshot, idempotency key, request identity and caller-supplied updated_at UPDATE denied by column grants; DELETE denied. | Existing active membership was read only and used as a local claim. This is a SQL role simulation, not live browser/Data API mutation. |
| Trigger defense in depth | Privileged attempts to change name, phone, total, items_snapshot, idempotency key and request identity each raised snapshot check violation; an attempted caller-supplied updated_at was replaced by DB time. | Privileged trigger tests were confined to the fixture and rolled back. They do not constitute Admin CRUD through a privileged client. |
| Rollback and independent cleanup verification | The SQL batch explicitly ended in `ROLLBACK`. A separate SQL call confirmed exact fixture UUID absent, total orders 0, REAL products 4, TEST_ONLY products 0, Storage objects 3, active Admin memberships 1. REAL products digest `3e2e545451e7d9a47a2681542169ef95` and REAL product image rows digest `eaebeb4362391e4a17959e53fe6c1455` matched the read-only preflight. | No persistent order fixture or external notification. |

The only `order_requests` trigger found was BEFORE UPDATE snapshot protection; the SQL fixture INSERT did not pass through the application notification function. Telegram notification was not invoked by this transaction. No Production mutation, schema/RLS/grant change, REAL row update, or membership change occurred.

## Owner partial fixture approval — authenticated Storage QA (2026-10-08)

A temporary `/admin/t070-storage-qa` route was published **only** on `t070-preview-review` in READY Preview SHA `c098f4184af00e2cb7cb8a9b93b9c08117e496d6`. It required `VERCEL_ENV=preview`, `VERCEL_TARGET_ENV=preview`, the exact review branch and Preview project ID; page read required `requireAdmin()`, and every POST Server Action required `requireAdminMutation()` (including exact-Origin and live active-membership checks). The route accepted no bucket/path input, held only a 2×2 synthetic WebP, used the request-scoped authenticated user cookie/JWT Supabase client for Admin Storage operations, and a separate cookie-free publishable-key client for anonymous probes. No Secret/service-role client, password, JWT or cookie was exposed by the UI. GET caused no mutation. This temporary route and its two helper files were removed after the fixture check; they are not part of the final review tree.

Owner signed in securely to the matching READY Preview. Before writing, independent read-only Preview SQL showed REAL products 4, TEST_ONLY products 0, orders 0, Storage objects 3, active Admin memberships 1, the exact approved object path absent, wrong-prefix path absent and no linked `product_images` row.

| Operation | Live result | Limit |
|---|---|---|
| Anonymous upload before fixture creation | API returned error, Admin `info` confirmed exact path absent. PASS denial. | Separate anonymous publishable-key client with no cookies/JWT; invoked from a guarded QA Server Action. |
| Active Admin upload | PASS. User-session Storage API created only `product-media/products/937166d4-fecf-4fac-8d40-3dc74286f557/TEST_ONLY_T070_937166d4.webp`; independent metadata read saw 4 total objects, exactly 1 at this path, 0 image rows. | No REAL product ID, product row, or image row used. |
| Overwrite/upsert | Rejected; exact fixture remained present. PASS. | The attempted overwrite used only the synthetic fixture. |
| Wrong path upload | Rejected; the fixed `t070-invalid/TEST_ONLY_T070_937166d4.webp` path remained absent. PASS. | No additional object was created. |
| Anonymous delete | Storage SDK reported no error but the Admin `info` check showed the exact object still present. **Effective deletion denied**, although this is not an explicit API-error response. | Do not label the API response itself as a rejection. |
| Active Admin delete | PASS. Authenticated Storage API removed only the exact fixture; Admin `info` confirmed absence. | No broad-prefix delete. |
| Independent cleanup verification | Exact path 0, wrong path 0, all T070-labelled objects 0, linked image rows 0, total media objects 3, orders 0, REAL products 4, TEST_ONLY products 0, active memberships 1. REAL product digest `3e2e545451e7d9a47a2681542169ef95` and REAL image-row digest `eaebeb4362391e4a17959e53fe6c1455` matched preflight. | Storage object identity set was counted and T070 paths checked independently. No image bytes were read from REAL objects. |

The temporary route was removed from the review source. Vercel deployment `dpl_56jwivt7PXTEm9kxHoGoaRfYyyJV` for route-free SHA `afbc7939c4f6e8ba9fb157e218122bd0ee5abf7e` was READY, and a direct browser GET to `/admin/t070-storage-qa` on that deployment rendered 404. The earlier immutable Preview carrying SHA `c098f418…` may remain directly addressable unless its deployment is explicitly removed; it must not be treated as the final review URL. No confirmed security vulnerability emerged from the completed checks. The anonymous delete success-with-no-effect response is documented precisely rather than misreported as an HTTP rejection.

Timed session expiry/token refresh, separately signed non-admin/revoked accounts, direct authenticated PostgREST mutation attempts, full REAL-free Admin product/category/media/order mutation E2E and a signed-session order mutation remain UNVERIFIED. The SQL role simulation does not prove signed-session RLS. T070 remains BLOCKED pending Owner integrated security verification; T071 has not started.

## Build and gate

Targeted synthetic regressions, lint and typecheck passed locally before the temporary route. The three temporary QA files also passed local lint and typecheck on a scratch checkout; Vercel deployment for SHA `c098f4184af00e2cb7cb8a9b93b9c08117e496d6` was READY and served the authenticated Storage run. Local `next build` could not fetch Prata/Manrope from Google Fonts because this execution environment cannot reach fonts.googleapis.com; local build remains UNVERIFIED. The route-free deployment for SHA `afbc7939c4f6e8ba9fb157e218122bd0ee5abf7e` was READY and direct route 404 was observed. This subsequent documentation-only revision retains the same implementation tree. Earlier T070 Vercel deployment `dpl_7kt55pMpzauvY8KozumKR9mB23Ko` for SHA `5735dc4b58cda1f94015f7122041b61c2f12bed1` was READY for the Admin read-only smoke.

Production Content Gate = BLOCKED; Legal sign-off = PENDING; runtime consent mechanism = NOT PRESENT. Permanent Checkout submit remains DISABLED. Production, Production env, Supabase schema/RLS/Auth settings, REAL data, `redesign-v2` and `main` were not changed by these checks.

## Owner-authorized legacy deployment cleanup and read-only follow-up (2026-10-09)

Owner gave final, exact-ID confirmation to remove only Vercel deployment `dpl_6xnBRgn95ViPrFSWDVjuHSfVoujE` (Preview project `marmix-flex-redesign-v2-preview`, commit `c098f4184af00e2cb7cb8a9b93b9c08117e496d6`). Immediately before deletion, Vercel API and UI agreed on the ID, project, SHA, branch and READY state. The project alias list assigned **zero current aliases** to this old deployment; the branch alias was assigned to current deployment `dpl_7eyCJd6zG6ySf9oBwRUVuu8NZRab`. The old deployment detail retained the branch alias in its historical `alias` field, which was not evidence of a current assignment.

The final Vercel Delete Deployment dialog was used only for the old ID. Vercel redirected with `deploymentDeleted=1`. A subsequent deployment-ID lookup returned `404 not_found`; a direct GET to the old immutable URL's `/admin/t070-storage-qa` displayed `404 DEPLOYMENT_NOT_FOUND`. No other deployment or alias was deleted. Current deployment `dpl_7eyCJd6zG6ySf9oBwRUVuu8NZRab` remained READY at commit `2cb89a2772b996fbd34af3722910940942e53462`; its `/admin/t070-storage-qa` rendered application 404. The public `/catalog` loaded three published materials. An anonymous direct `/admin` request redirected to `/admin/login?next=%2Fadmin`; an active signed Admin route smoke **after** the deletion was not performed and remains UNVERIFIED. The prior signed Admin login/read-only navigation/logout evidence above remains valid for its original deployment and time.

A read-only Preview DB count after deletion found REAL products 4, TEST_ONLY products 0, orders 0, `product-media` objects 3, T070-labelled objects 0, product image rows 3 and active Admin memberships 1. The order transaction and Storage fixture tests were not rerun. No Supabase mutation accompanied deployment cleanup.

### Read-only browser and privacy audit boundary

- Anonymous rendered HTML on current `/catalog` and `/admin/login` was inspected without recording response bodies or contact values. In those two documents, scans found zero occurrences of `sb_secret_`, `service_role`, database URL or PEM private-key markers, and zero `items_snapshot`, `internal_note`, `idempotency_key`, `admin_users` or `order_requests` markers. This is limited HTML evidence, not a full private-data audit.
- The current catalog loaded same-origin Next.js JS assets. The deployment file-tree API returned `404 file_tree_not_found`; the cloud browser blocked direct opening of a JS asset with `ERR_BLOCKED_BY_CLIENT`, and its read-only page evaluator did not expose a fetch API. **Public bundle content audit = UNVERIFIED.** No claim is made that all bundles are secret-free.
- The available browser inspection did not expose HTTP response headers. **Protected Admin cache/privacy header audit = UNVERIFIED.** Earlier source inspection recorded dynamic/no-store Orders pages and independent Admin guards, but does not prove deployed HTTP headers.
- Anonymous Admin redirect remains LIVE VERIFIED. Signed non-admin and revoked sessions, timed expiry/refresh, post-deletion signed Admin access, direct authenticated PostgREST mutations, browser traffic-level PII and full bundle leakage remain UNVERIFIED. No confirmed vulnerability was identified in the limited read-only inspection.

### Proposed direct mutation and signed-session matrix — not executed

| Context | Target/action | Required proof and safety boundary |
|---|---|---|
| Anonymous | Products/categories/images/order requests and Storage INSERT/UPDATE/DELETE | Confirm denied by live API and unchanged exact fixture IDs; no REAL IDs or broad paths. The completed SQL role simulation is separate evidence. |
| Signed non-admin | Same direct Data API/Storage mutations | Requires a separately approved test Auth account without changing the sole REAL Admin membership. Verify signed JWT context and exact post-attempt absence. |
| Revoked Admin with unexpired token | Admin routes, Server Actions, PostgREST and Storage writes | Requires a separately approved disposable membership/account and revocation procedure; never revoke the sole REAL membership. Confirm live denial after revocation without relying on SQL role simulation. |
| Active Admin | Product/category/media create/update/delete and order status/internal_note | Requires owner-approved isolated persistent TEST_ONLY fixtures, exact-ID cleanup and baseline/digest comparison. Never modify REAL products/images/orders. |
| Active Admin negative order writes | Contact, total, snapshot, idempotency and request identity updates | Requires a synthetic order fixture through the signed user boundary with external notification risk assessed and cleanup approved. The prior rollback-only SQL test does not count as signed-session proof. |
| Existing active session | Passive refresh/expiry and private-data traffic inspection | Can be observed read-only without settings changes; exact expiry timing, response headers and network capture tooling must be available before claiming PASS. Do not log cookies/JWT/private bodies. |

No new account, fixture, mutation attempt, schema/RLS/Auth change, production action or T071 work was performed in this follow-up. T070 remains BLOCKED pending separate Owner integrated security verification. Production Content Gate = BLOCKED; Legal sign-off = PENDING; runtime consent mechanism = NOT PRESENT.


## Remaining read-only security QA (2026-10-09, current READY Preview)

The exact review HEAD was `1aa9502f2bbce39ec3311f0da3ec88d6713e0eeb`; Vercel deployment `dpl_9MLc4nni8hrnje2e81zvapuXwP3t` was READY at that SHA. `redesign-v2` remained `0898cd02ef97e529e6aeedb9f850e2c535d8f4b2` and `main` remained `9927f4c83127b954a647a848d4ed09cc65faaee6`. Legacy deployment deletion and the earlier SQL/Storage evidence were not repeated.

| Check | Observation | Classification |
|---|---|---|
| Anonymous protected route | Direct browser navigation to `/admin/orders` ended at `/admin/login?next=%2Fadmin`. The final login DOM contained no `items_snapshot`, `internal_note`, `order_requests` marker or private Orders empty-state text. Its rendered robots meta was `noindex, nofollow`. | LIVE PASS for this anonymous denial and rendered login noindex only; this does not establish the initial HTTP redirect code or headers. |
| Published public JS | `/catalog` exposed same-origin `/_next/static/immutable/chunks/*.js` URLs. Direct cloud-browser navigation to one published chunk returned `ERR_BLOCKED_BY_CLIENT`. Local `curl -I` could not connect to this execution environment's proxy. No JS bytes were inspected. | UNVERIFIED for deployed bundle secrets/private-data audit. Source inspection is not substituted for deployed artifact inspection. |
| Admin HTTP cache/privacy | Browser DOM inspection lacks response headers; local direct HTTP failed at the environment proxy. The Vercel protected-fetch connector was rejected by automatic approval review because it can create/reuse a temporary authentication-bypass link. It was not used. | UNVERIFIED for actual `Cache-Control`, redirect status and `X-Robots-Tag`; source `force-dynamic`, `force-no-store` and metadata are separate static assertions. |
| Session | Prior signed Owner Admin login, read-only route traversal, refresh persistence, logout and subsequent denial remain LIVE evidence at the earlier deployment. Current browser was anonymous; this turn did not enter credentials or run a new signed login/logout, token refresh or timed expiry. | Current anonymous denial LIVE PASS; post-deletion signed session and refresh/expiry UNVERIFIED. |

No vulnerability was confirmed by these narrow observations. Bundle audit, actual cache headers and traffic-level private-data inspection remain open. The blocked Vercel connector method must not be used without a separately authorized bypass-link action.

### Owner Windows Playwright continuation — anonymous and read-only

Use the existing local repository checkout and installed Playwright/Chromium. If Playwright is not installed, install it locally without changing `package.json` or lockfile: `npm install --no-save --package-lock=false playwright`, then `npx playwright install chromium`. Do not sign in for this probe. It requests only public routes and an anonymous Admin route on the exact READY Preview. It records counts and selected HTTP headers, never response bodies, cookies, tokens or matched secret values. Run in VS Code PowerShell at the repository root:

```powershell
New-Item -ItemType Directory -Force .qa-local\t070 | Out-Null
@'
import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
const origin = "https://marmix-flex-redesign-v2-preview-qgwqllf4w.vercel.app";
const routes = ["/", "/catalog", "/product/azur", "/cart", "/checkout",
  "/applications", "/about", "/delivery", "/contacts", "/admin/login"];
const patterns = {
  supabaseSecret: /sb_secret_[A-Za-z0-9._-]{12,}/g,
  serviceRoleMarker: /service_role/g,
  databaseUrl: /postgres(?:ql)?:\/\/[^\s"'<>]+/g,
  privateKey: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  orderFieldMarkers: /\b(?:items_snapshot|internal_note|idempotency_key)\b/g,
};
const report = { origin, routes: [], admin: {}, bundles: {
  discovered: 0, fetched: 0, non200: 0, signals: Object.fromEntries(
    Object.keys(patterns).map(k => [k, 0])) } };
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ serviceWorkers: "block" });
const scripts = new Set();
try {
  for (const route of routes) {
    const page = await context.newPage();
    const row = { route, status: null, redirectStatuses: [], robots: null };
    page.on("response", response => {
      if (response.request().resourceType() === "document" &&
          response.url().startsWith(origin + "/admin")) {
        if (route === "/admin/orders") row.redirectStatuses.push(response.status());
      }
      if (response.url().startsWith(origin + "/_next/") &&
          response.url().split("?")[0].endsWith(".js")) scripts.add(response.url());
    });
    const response = await page.goto(origin + route, { waitUntil: "networkidle" });
    row.status = response?.status() ?? null;
    row.robots = await page.locator('meta[name="robots"]').first()
      .getAttribute("content").catch(() => null);
    await page.close();
    report.routes.push(row);
  }
  const page = await context.newPage();
  page.on("response", response => {
    if (response.request().resourceType() !== "document" ||
        !response.url().startsWith(origin + "/admin")) return;
    const h = response.headers();
    (report.admin.responses ??= []).push({
      status: response.status(), cacheControl: h["cache-control"] ?? null,
      xRobotsTag: h["x-robots-tag"] ?? null, contentType: h["content-type"] ?? null
    });
  });
  const response = await page.goto(origin + "/admin/orders",
    { waitUntil: "domcontentloaded" });
  report.admin.finalStatus = response?.status() ?? null;
  report.admin.finalPath = new URL(page.url()).pathname;
  report.admin.robots = await page.locator('meta[name="robots"]').first()
    .getAttribute("content").catch(() => null);
  report.admin.privateMarkerCount = await page.evaluate(() =>
    ["items_snapshot", "internal_note", "order_requests"]
      .filter(x => document.documentElement.innerHTML.includes(x)).length);
  await page.close();

  report.bundles.discovered = scripts.size;
  for (const url of scripts) {
    const response = await context.request.get(url);
    if (response.status() !== 200) { report.bundles.non200++; continue; }
    const body = await response.text();
    report.bundles.fetched++;
    for (const [name, pattern] of Object.entries(patterns)) {
      report.bundles.signals[name] += [...body.matchAll(pattern)].length;
    }
  }
} finally { await context.close(); await browser.close(); }
await writeFile(".qa-local/t070/security-readonly.json",
  JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
'@ | Set-Content -Encoding UTF8 .qa-local\t070\read-only-audit.mjs
node .qa-local\t070\read-only-audit.mjs
```

Keep `.qa-local/t070/security-readonly.json` local and out of Git. Any nonzero signal count is a **manual-review lead**, not proof of credential exposure; the script deliberately withholds matched values. A zero count covers only JS loaded by those anonymous pages and those patterns, not all deployed chunks, network PII or complete application security. Report bundle and header checks as UNVERIFIED until Owner runs and reviews the local probe; a blocked request or incomplete bundle set is not PASS.

### Proposed isolated signed-session sequence — plan only

One disposable Preview Auth user could be used in sequence: (1) signed non-admin with no `admin_users` row; (2) the **same** user with one temporary existing-schema `admin_users(is_active=true)` row; (3) the same signed user after that row is set inactive while the token remains valid. This introduces no new role, does not alter the sole REAL Admin membership and uses no REAL personal contact. The proposed identity is a randomly named `TEST_ONLY_T070` address under a reserved invalid test domain, subject to Auth accepting it **without sending mail**; if Auth requires a real mailbox or triggers an email, stop and redesign the fixture plan. Owner would generate the password locally and never share it in chat, Git, logs or reports.

Provisioning/deprovisioning requires separate Owner approval and a Preview-only Auth administrative boundary; ordinary Admin CRUD checks would still use the signed user client and RLS, never a Secret client. Record the exact generated Auth UUID privately, establish baseline counts (4 REAL products, 0 TEST_ONLY products, 0 orders, 3 Storage objects, 1 active membership), and verify no UUID collision. Before temporary elevation, assert own membership absent and deny protected routes, Server Actions and direct Data API/Storage writes against isolated nonexistent or approved fixture IDs. Add only the exact temporary membership row, assert active Admin access, then set `is_active=false` and verify denial **with the existing token**. No update to the Owner membership. Delete only the exact temporary membership and Auth user by UUID; independently verify `auth.users`, `admin_users`, identities and application fixture rows absent and baseline counts restored. Auth audit logs or provider delivery logs may persist under retention policies, so “zero residuals” can only cover application/Auth records, not all provider logs. If cleanup fails, stop, retain the exact UUID privately for Owner recovery and do not broadly delete anything.

Persistent product/category/image and order fixtures are **not** covered by this plan's authorization. Active Admin mutation E2E needs a separate disposable TEST_ONLY product and, where required, associated exact image/Storage paths with cleanup of dependent rows; no REAL product IDs or existing media. Signed-session order status/note and snapshot denial need a separate synthetic order, precise UUID, externally inert contacts, and exact-ID cleanup. Direct `/api/order-requests` is disallowed for this QA because it may trigger Telegram; DB-only fixture setup would have to be independently confirmed not to notify, while signed Admin mutations use the user RLS boundary. Failure or ambiguity in notification/cleanup behavior blocks persistent fixture creation. Timed expiry cannot be accelerated by changing Auth settings; only passive observation of a naturally expiring session could later be reported. No Auth user, membership, product, order or Storage object was created here.

Separate Owner approval is required for temporary Auth provisioning/elevation/revocation/deletion, signed mutation attempts, and each persistent product/order/media fixture with its exact cleanup plan. Until then: T070 BLOCKED; Production Content Gate BLOCKED; Legal sign-off PENDING; runtime consent mechanism NOT PRESENT; T071 NOT STARTED.

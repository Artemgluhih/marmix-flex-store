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

The temporary route is removed from the final review source and must return 404 on its new READY Preview. The earlier immutable Preview carrying SHA `c098f418…` may remain directly addressable unless its deployment is explicitly removed; it must not be treated as the final review URL. No confirmed security vulnerability emerged from the completed checks. The anonymous delete success-with-no-effect response is documented precisely rather than misreported as an HTTP rejection.

Timed session expiry/token refresh, separately signed non-admin/revoked accounts, direct authenticated PostgREST mutation attempts, full REAL-free Admin product/category/media/order mutation E2E and a signed-session order mutation remain UNVERIFIED. The SQL role simulation does not prove signed-session RLS. T070 remains BLOCKED pending Owner integrated security verification; T071 has not started.

## Build and gate

Targeted synthetic regressions, lint and typecheck passed locally before the temporary route. The three temporary QA files also passed local lint and typecheck on a scratch checkout; Vercel deployment for SHA `c098f4184af00e2cb7cb8a9b93b9c08117e496d6` was READY and served the authenticated Storage run. Local `next build` could not fetch Prata/Manrope from Google Fonts because this execution environment cannot reach fonts.googleapis.com; local build remains UNVERIFIED. The final route-free review deployment must be checked separately for READY and route 404. Earlier T070 Vercel deployment `dpl_7kt55pMpzauvY8KozumKR9mB23Ko` for SHA `5735dc4b58cda1f94015f7122041b61c2f12bed1` was READY for the Admin read-only smoke.

Production Content Gate = BLOCKED; Legal sign-off = PENDING; runtime consent mechanism = NOT PRESENT. Permanent Checkout submit remains DISABLED. Production, Production env, Supabase schema/RLS/Auth settings, REAL data, `redesign-v2` and `main` were not changed by these checks.

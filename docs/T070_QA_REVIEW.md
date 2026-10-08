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
| UNVERIFIED | Invalid credentials and signup, timed session expiry/token refresh, separate non-admin and revoked signed Auth accounts, direct authenticated PostgREST/Storage mutation denials, actual Storage upload/delete and orphan cleanup, order status/note and immutable snapshot against a TEST_ONLY fixture. | No extra Auth account or fixture was created. Existing transactional and synthetic checks do not replace these live paths. |

## Fixture baseline and safety

Before any T070 writes, Preview had 0 `catalog_kind=TEST_ONLY` products, 0 order rows with TEST_ONLY name, 0 Storage keys containing TEST_ONLY and one active Admin membership. No T070 Auth account, product, category, image, Storage object or order was created by the checks above or the subsequent Admin browser read-only checks. Exact fixture IDs are therefore not applicable yet; cleanup has no T070 fixtures to remove. Do not interpret these narrow counts as a broad scan for every historic test naming convention.

## Security and privacy observations

- Each inspected Admin page invokes `requireAdmin()` independently; mutation action files invoke `requireAdminMutation()`. The guard uses Auth `getUser()` and active own-row membership under the cookie-backed authenticated RLS client. The isolated harness rejects cross-origin before Auth and denies missing, non-admin and revoked contexts.
- Orders list/detail are dynamic, no-store and private by source inspection. Status and note are the only authorized order UPDATE columns; the snapshot trigger is enabled. Existing synthetic order tests cover transition, conflict and public response boundaries. No live order exists in Preview for a T070 detail mutation.
- Storage paths and MIME/size validation pass isolated tests. Bucket/prefix/admin policies are present. Direct HTTP denial, upload, deletion and orphan recovery are **UNVERIFIED** in this review until safe fixture work occurs.
- A narrow source scan found no Secret client import in the inspected ordinary Admin actions. No traffic-level PII or browser-bundle secret audit is claimed yet.
- Confirmed security vulnerabilities: none from the checks completed. This is not a claim that the unverified matrix is secure.

## Live browser observations and remaining fixture plan

- Active session route sequence: `/admin` → `/admin/products` → REAL product editor/media → `/admin/categories` → `/admin/orders` (0 rows) → refresh Orders → logout → direct Orders denied. No REAL form values were edited or saved.
- The browser's console exposed repeated `Error sending browser metadata to extension: Object` entries. Their source was the browser extension metadata channel; an app runtime error was not established from those entries. No broad console/network or traffic-level PII claim is made.
- Fixture plan, **not executed**: preflight exact TEST_ONLY baselines and existing REAL IDs; use a unique T070 label to create an isolated TEST_ONLY product/order and a distinct Storage path; exercise only those IDs with the authenticated RLS boundary; verify order commercial/contact snapshot before and after allowed status/note update; test upload/delete and denial paths; remove Storage object and dependent rows in reverse order; recheck zero T070 artifacts and unchanged REAL rows. Do not alter the sole active Admin membership. Stop if a step lacks a reliable cleanup route. Separate Owner approval is required before risk-bearing writes.
- Separate signed non-admin/revoked sessions would require safe account provisioning or an existing approved fixture; neither is available. No Auth account or role was created.

## Build and gate

Targeted synthetic regressions, lint and typecheck passed locally before this update. Local `next build` could not fetch Prata/Manrope from Google Fonts because the execution environment cannot reach fonts.googleapis.com; local build remains UNVERIFIED. Vercel deployment `dpl_7kt55pMpzauvY8KozumKR9mB23Ko` for SHA `5735dc4b58cda1f94015f7122041b61c2f12bed1` was READY and served the Admin browser smoke above. This establishes the Vercel build/deployment, not a local build.

Production Content Gate = BLOCKED; Legal sign-off = PENDING; runtime consent mechanism = NOT PRESENT. Permanent Checkout submit remains DISABLED. Production, Production env, Supabase schema/RLS/Auth settings, REAL data, `redesign-v2` and `main` were not changed by these checks.

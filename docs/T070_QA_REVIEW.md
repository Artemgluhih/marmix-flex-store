# T070 — Admin integrated security QA (review)

**Status:** BLOCKED — owner integrated security verification. This is a technical QA review, not an authorization to update `redesign-v2`, Production, schema, RLS or Auth settings. T071 has not started.

## Evidence classes

| Class | Evidence | Result and limit |
|---|---|---|
| LIVE VERIFIED | Anonymous browser on the READY T069 baseline deployment (`0898cd02ef97e529e6aeedb9f850e2c535d8f4b2`): direct `/admin`, `/admin/products`, `/admin/categories`, `/admin/orders`, and an order detail UUID all led to the login form. | Anonymous route denial PASS on the baseline. The T070 review deployment and authenticated Admin browser flow remain separate checks. |
| TRANSACTIONAL VERIFIED | Preview DB, read-only SQL inside `BEGIN`/`ROLLBACK`, `SET LOCAL ROLE`, synthetic non-admin `request.jwt.claim.sub`. | Anon sees 3 published products and 3 categories; order SELECT/INSERT/UPDATE/DELETE grants absent and Storage metadata rows 0. Synthetic non-admin: own membership 0, orders 0, private products 0, private images 0 and Storage metadata 0. An existing active membership impersonated only within the transaction: own active row 1, products 4, categories 3, image rows 3, media objects 3 and orders 0. Order status/note column UPDATE grants exist, snapshot/contact UPDATE and DELETE grants do not. This SQL role simulation is not a signed Auth browser/JWT or direct Data API request. |
| LIVE VERIFIED (configuration) | Preview DB policy catalog. | RLS enabled for `admin_users`, products, categories, product images/memberships, orders and Storage objects. Storage policy is limited to the product-media bucket, `products/<UUID>/<key>.<image extension>` and active membership; no UPDATE policy for upsert. Product/media RPCs are security invoker; order snapshot protection trigger enabled. Policy existence alone does not prove every request path. |
| SYNTHETIC VERIFIED | `tests/admin-security-qa.test.cjs`: exact-origin and redirect matrix, independent read/mutation guard behavior, non-admin/revoked denial, malformed Storage path/file validation and mutation-action guard inventory. Existing `order-actions`, `order-privacy`, `product-workflow`, `category-order` and `order-flow-integration` tests passed. | Mocked clients and code execution only. No claim of live login, direct HTTP mutation or actual Storage upload. |
| UNVERIFIED | Active Admin login/logout, Product/Category/Media/Orders browser E2E, invalid credentials and signup, live session expiry/refresh, separate non-admin and revoked Auth accounts, direct authenticated PostgREST/Storage denials, actual Storage upload/delete and orphan cleanup, order mutation/immutability against a fixture. | Requires an authenticated review session and carefully isolated fixtures. Do not change the sole real membership or any REAL product, media or order. |

## Fixture baseline and safety

Before any T070 writes, Preview had 0 `catalog_kind=TEST_ONLY` products, 0 order rows with TEST_ONLY name, 0 Storage keys containing TEST_ONLY and one active Admin membership. No T070 Auth account, product, category, image, Storage object or order was created by the checks above. Exact fixture IDs are therefore not applicable yet; cleanup has no T070 fixtures to remove. Do not interpret these narrow counts as a broad scan for every historic test naming convention.

## Security and privacy observations

- Each inspected Admin page invokes `requireAdmin()` independently; mutation action files invoke `requireAdminMutation()`. The guard uses Auth `getUser()` and active own-row membership under the cookie-backed authenticated RLS client. The isolated harness rejects cross-origin before Auth and denies missing, non-admin and revoked contexts.
- Orders list/detail are dynamic, no-store and private by source inspection. Status and note are the only authorized order UPDATE columns; the snapshot trigger is enabled. Existing synthetic order tests cover transition, conflict and public response boundaries. No live order exists in Preview for a T070 detail mutation.
- Storage paths and MIME/size validation pass isolated tests. Bucket/prefix/admin policies are present. Direct HTTP denial, upload, deletion and orphan recovery are **UNVERIFIED** in this review until safe fixture work occurs.
- A narrow source scan found no Secret client import in the inspected ordinary Admin actions. No traffic-level PII or browser-bundle secret audit is claimed yet.
- Confirmed security vulnerabilities: none from the checks completed. This is not a claim that the unverified matrix is secure.

## Build and gate

Targeted synthetic regressions, lint and typecheck passed locally. Local `next build` could not fetch Prata/Manrope from Google Fonts because the execution environment cannot reach fonts.googleapis.com. This is an environment limitation, **not** a build PASS. READY Vercel build and Preview smoke must be recorded separately once available.

Production Content Gate = BLOCKED; Legal sign-off = PENDING; runtime consent mechanism = NOT PRESENT. Permanent Checkout submit remains DISABLED. Production, Production env, Supabase schema/RLS/Auth settings, REAL data, `redesign-v2` and `main` were not changed by these checks.

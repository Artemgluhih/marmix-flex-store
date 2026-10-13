# T070 — локальный signed-session runner (implementation only)

**Текущий статус:** T070 BLOCKED, T071 NOT STARTED. Owner уже подготовил TEST_ONLY fixtures и подтвердил одну signed non-admin SELECT и одну отрицательную PATCH; Storage остаётся UNVERIFIED. Ниже прежняя инструкция dry-run и новая инструкция Storage-only resume. Runner привязан к Supabase Preview `twuevnwxwqdjbjzwuglm`, review-ветке `t070-preview-review` и неизменяемому приложению `https://marmix-flex-redesign-v2-preview-efx5iy5ej.vercel.app` (deployment `f0a5522e766a7f203b75d50c0862c2619278161a`). `--review-sha` относится к HEAD с runner; deployment SHA относится к проверяемому приложению. Новый Storage-only live запуск требует отдельного Owner approval, проверки обоих SHA и exact fixture preflight.

## VS Code Terminal на Windows (PowerShell)

В корне существующего репозитория:

```powershell
git switch t070-preview-review
git pull --ff-only origin t070-preview-review
npm ci
npm install --no-save --package-lock=false playwright@1.62.1
npx playwright install chromium
$reviewSha = (git rev-parse HEAD).Trim()
node scripts/t070-signed-security-qa.mjs --self-test
node scripts/t070-signed-security-qa.mjs --dry-run --review-sha $reviewSha
```

Dry-run не спрашивает credentials, не создаёт fixtures и не выполняет mutation. Локальный обезличенный результат: `.qa-local/t070/security-signed.json`. При сетевой ошибке либо отсутствии Chromium статус **UNVERIFIED**, код выхода 2. Не запускайте `--execute` и `--observe-expiry` до отдельного согласования Owner и безопасной подготовки всех exact fixtures.

На Windows Preview может добавить необязательный скрипт обратной связи Vercel. Runner **блокирует** его сетевой запрос и считает отдельно в `optional_feedback_blocked`; это не расширяет разрешённые origins. Для успешного dry-run нужны `preview_http_local_csp_cors=PASS`, `preview_config_and_cors=PASS`, `external_requests_blocked=PASS` с нулём неизвестных запросов и `localhost_interception=PASS` с нулём перехватов локальной страницы. Если один из обязательных пунктов UNVERIFIED, сохраните только обезличенный JSON и остановитесь: не вводите credentials.

## Границы будущего запуска

`--execute` повторил бы уже завершённую PATCH и **не должен использоваться для Storage resume**. Локальный `.qa-local/t070/approved-fixtures.json` подготовлен Owner для Windows и не коммитится. `--observe-expiry` использует отдельный `.qa-local/t070/approved-auth.json` и не доказывает refresh приложения; его следует рассматривать отдельно. Эти локальные файлы не должны содержать пароль или JWT. Строка `OWNER_APPROVED_T070_SIGNED_EXECUTION` в manifest — техническая защита от случайного запуска, **не** заменяет фактическое разрешение Owner или независимый baseline.

После будущего согласования Owner вводит пароль только в локальном Chromium окне на `127.0.0.1`. Runner не принимает password/JWT через CLI, env, URL или файл. Он проверяет exact Preview origin, CORS, CSP, Supabase project, review HEAD, fixture IDs, TEST_ONLY/unpublished state из manifest и требует отдельные ручные доверенные baseline/digest checkpoints. Одноразовые denied writes не повторяются после timeout. Обычные probe-запросы используют signed пользовательский bearer, не service_role. Browser context не сохраняется; трассировка, HAR, screenshot, video и storageState не пишутся. На уровне ОС нельзя гарантировать отсутствие paging/crash dump, как указано в [security design](T070_SIGNED_QA_DESIGN.md).

Анонимный маркер проверяется в отдельном browser context. Authenticated Admin route headers наблюдаются в контексте временного Admin, а не выводятся из source assertions. Полный traffic-level PII audit, весь набор JS chunks, естественный refresh приложения и подписанный Create Product workflow этим runner автоматически не подтверждаются. Кандидат на acceptance exception для Admin Create Product: **не создавать REAL ради QA**; штатный Create form → REAL RPC и его error/retry path остаются UNVERIFIED. Это предложение **не принято** до финального решения Owner.

При неопределённом outcome или изменении exact TEST_ONLY target остановить запуск, проверить exact ID/path через доверенный Preview read-only канал и согласовать восстановление. Никакой broad cleanup или повторного mutation запроса. Отчёт содержит только allowlisted status/count/verdict/cache directives и не содержит private response bodies, cookies, токенов, secrets, контактов, UUID fixtures или Storage path.

## Storage-only resume после подтверждённой PATCH (2026-10-12)

Предыдущий Owner Windows signed-run подтвердил non-admin SELECT (0 private rows) и одну отрицательную PATCH (0 affected rows, независимый product digest неизменен). Его локальный отчёт хранится отдельно как `.qa-local/t070/security-signed-before-storage-fix.json`. Эти результаты **исторические**; новый отчёт их не копирует как новые LIVE PASS. Storage тогда остановился на read-only preflight: Preview возвращал HTTP 400/JSON `code=NoSuchKey` для отсутствующего exact объекта. Исправление и mock-тесты сохранены в runner.

`--resume-storage-only` — отдельная ветка исполнения. Она не вызывает `runPhases()`, `updateFixture()`, PATCH, ACTIVE/REVOKED, CSRF, cleanup или `--observe-expiry`. Она использует тот же локальный Chromium sign-in только для временного non-admin и заканчивается после отрицательных Storage upload/delete и независимой проверки. **Режим реализован, но его live запуск пока НЕ разрешён.** Manifest остаётся локально в `.qa-local/t070/approved-fixtures.json`, без пароля или JWT.

После отдельного Owner execution approval Owner сможет запустить на чистой review-ветке:

```powershell
git switch t070-preview-review
git pull --ff-only origin t070-preview-review
$reviewSha = (git rev-parse HEAD).Trim()
node scripts/t070-signed-security-qa.mjs --self-test
node scripts/t070-signed-security-qa.mjs --dry-run --review-sha $reviewSha
# ТОЛЬКО после отдельного разрешения на live Storage mutations:
node scripts/t070-signed-security-qa.mjs --resume-storage-only --review-sha $reviewSha
```

При live запуске Owner открывает именно Supabase Preview `twuevnwxwqdjbjzwuglm`, исполняет приведённый ниже **read-only** SQL через trusted Preview channel и вводит только два полученных CSV значения в локальный терминал на каждом checkpoint. Они не сохраняются runner в отчёте. При любом расхождении runner останавливается. Запрос сравнивает 18 счётчиков (включая ровно одну активную основную membership и ноль временных), точные TEST_ONLY IDs/path, 3 fixture digests, 10 прежних REAL full-row/identity digests и зафиксированный в read-only preflight digest основной Admin membership, используя ту же канонизацию, что в `docs/T070_QA_REVIEW.md`. SQL не возвращает контакты, Auth токены, реальные строки товаров или заметки.

```sql
WITH snapshot AS (
 SELECT
 (SELECT count(*) FROM public.products WHERE catalog_kind='REAL') AS real_products,
 (SELECT count(*) FROM public.products WHERE catalog_kind='TEST_ONLY') AS test_products,
 (SELECT count(*) FROM public.categories) AS categories,
 (SELECT count(*) FROM public.product_categories) AS memberships,
 (SELECT count(*) FROM public.product_images) AS images,
 (SELECT count(*) FROM storage.objects WHERE bucket_id='product-media') AS objects,
 (SELECT count(*) FROM public.order_requests) AS orders,
 (SELECT count(*) FROM auth.users) AS auth_users,
 (SELECT count(*) FROM public.admin_users WHERE is_active) AS active_admins,
 (SELECT count(*) FROM public.admin_users WHERE user_id='ea39d2af-f164-4b2c-a496-502f2464d9af'::uuid) AS temp_admin,
 (SELECT count(*) FROM public.products WHERE id='19bbe932-ee48-4306-b7f1-d615a5a64a34'::uuid
   AND sku='TEST_ONLY-T070-19BBE932' AND slug='t070-qa-product-20261009'
   AND catalog_kind='TEST_ONLY' AND NOT is_published AND NOT is_featured
   AND archived_at IS NULL AND availability_status IS NULL) AS exact_product,
 (SELECT count(*) FROM public.product_images WHERE id='2beefa3e-503d-4118-993a-920268f4d07d'::uuid
   AND product_id='19bbe932-ee48-4306-b7f1-d615a5a64a34'::uuid
   AND storage_path='products/19bbe932-ee48-4306-b7f1-d615a5a64a34/1a01d658-cec9-463a-be9d-53f8a9dd2434.webp') AS exact_image,
 (SELECT count(*) FROM storage.objects WHERE bucket_id='product-media'
   AND name='products/19bbe932-ee48-4306-b7f1-d615a5a64a34/1a01d658-cec9-463a-be9d-53f8a9dd2434.webp') AS exact_object,
 (SELECT count(*) FROM public.order_requests WHERE id='a8b701e4-7a1c-4f0c-8583-4195ed819278'::uuid
   AND status='new' AND internal_note IS NULL) AS exact_order,
 (SELECT count(*) FROM public.admin_users WHERE is_active
   AND user_id<>'ea39d2af-f164-4b2c-a496-502f2464d9af'::uuid) AS owner_admin,
 (SELECT count(*) FROM public.product_categories WHERE product_id='19bbe932-ee48-4306-b7f1-d615a5a64a34'::uuid) AS fixture_memberships,
 (SELECT count(*) FROM storage.objects WHERE bucket_id='product-media'
   AND name LIKE 'products/19bbe932-ee48-4306-b7f1-d615a5a64a34/%') AS fixture_folder,
 (SELECT count(*) FROM public.product_images WHERE product_id='19bbe932-ee48-4306-b7f1-d615a5a64a34'::uuid) AS fixture_images,
 (SELECT md5(to_jsonb(p)::text) FROM public.products p WHERE id='19bbe932-ee48-4306-b7f1-d615a5a64a34'::uuid) AS product_digest,
 (SELECT md5(to_jsonb(i)::text) FROM public.product_images i WHERE id='2beefa3e-503d-4118-993a-920268f4d07d'::uuid) AS image_digest,
 (SELECT md5((to_jsonb(o)-'status'-'internal_note'-'updated_at')::text)
   FROM public.order_requests o WHERE id='a8b701e4-7a1c-4f0c-8583-4195ed819278'::uuid) AS order_digest,
 md5(coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.id)::text FROM public.products p WHERE p.catalog_kind='REAL'),'[]')) AS real_rows,
 md5(coalesce((SELECT jsonb_agg(p.id ORDER BY p.id)::text FROM public.products p WHERE p.catalog_kind='REAL'),'[]')) AS real_ids,
 md5(coalesce((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.id)::text FROM public.product_images i WHERE i.product_id<>'19bbe932-ee48-4306-b7f1-d615a5a64a34'::uuid),'[]')) AS image_rows,
 md5(coalesce((SELECT jsonb_agg(i.id ORDER BY i.id)::text FROM public.product_images i WHERE i.product_id<>'19bbe932-ee48-4306-b7f1-d615a5a64a34'::uuid),'[]')) AS image_ids,
 md5(coalesce((SELECT jsonb_agg(to_jsonb(c) ORDER BY c.id)::text FROM public.categories c),'[]')) AS category_rows,
 md5(coalesce((SELECT jsonb_agg(c.id ORDER BY c.id)::text FROM public.categories c),'[]')) AS category_ids,
 md5(coalesce((SELECT jsonb_agg(to_jsonb(pc) ORDER BY pc.product_id,pc.category_id)::text FROM public.product_categories pc),'[]')) AS membership_rows,
 md5(coalesce((SELECT jsonb_agg(jsonb_build_object('product_id',pc.product_id,'category_id',pc.category_id) ORDER BY pc.product_id,pc.category_id)::text FROM public.product_categories pc),'[]')) AS membership_ids,
 md5(coalesce((SELECT jsonb_agg(to_jsonb(o) ORDER BY o.id)::text FROM storage.objects o WHERE o.bucket_id='product-media'
   AND o.name NOT LIKE 'products/19bbe932-ee48-4306-b7f1-d615a5a64a34/%'),'[]')) AS storage_rows,
 md5(coalesce((SELECT jsonb_agg(jsonb_build_object('id',o.id,'name',o.name) ORDER BY o.id)::text FROM storage.objects o
   WHERE o.bucket_id='product-media' AND o.name NOT LIKE 'products/19bbe932-ee48-4306-b7f1-d615a5a64a34/%'),'[]')) AS storage_ids,
 md5(coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.user_id)::text FROM public.admin_users a
   WHERE a.user_id<>'ea39d2af-f164-4b2c-a496-502f2464d9af'::uuid),'[]')) AS owner_admin_digest
)
SELECT concat_ws(',', real_products,test_products,categories,memberships,images,objects,orders,
  auth_users,active_admins,temp_admin,exact_product,exact_image,exact_object,exact_order,
  owner_admin,fixture_memberships,fixture_folder,fixture_images) AS counts_csv,
 concat_ws(',', product_digest,image_digest,order_digest,real_rows,real_ids,image_rows,image_ids,
  category_rows,category_ids,membership_rows,membership_ids,storage_rows,storage_ids,owner_admin_digest) AS digests_csv
FROM snapshot;
```

Runner повторяет этот trusted checkpoint перед локальным входом, перед upload, после upload, перед delete и после delete. Он также проверяет SHA-256 исходного WebP через публичный exact URL. Для сгенерированного пути Owner отдельно подтверждает отсутствие до upload и число объектов `0` после него по exact-path trusted SELECT. Два разных ввода `UPLOAD_APPROVED` и `DELETE_APPROVED` непосредственно предшествуют каждой одноразовой пробе. HTTP-ответ **сам по себе** не считается доказательством отказа. При timeout/неопределённом результате runner останавливается без retry; exact generated TEST_ONLY path показывается локально для адресного восстановления, но в JSON не записывается. Никакого перехода к ACTIVE, повторной PATCH или автоматического cleanup нет. Сохранённый ранее signed SELECT/UPDATE PASS остаётся только в отдельном историческом отчёте.


## DELETE-only continuation after Owner-verified upload denial

The prior upload's live evidence is documented in `docs/T070_QA_REVIEW.md`; its runner verdict remained UNVERIFIED because that version accepted only HTTP 401/403. **Do not rerun `--resume-storage-only` or `--execute` to reach DELETE.** The isolated `--resume-storage-delete-only` never calls upload, PATCH or the ACTIVE/REVOKED/CSRF phases. Implementation and mock tests do not authorize a live DELETE; obtain separate Owner approval before executing it.

After that approval, in the existing Windows repository, verify the new review HEAD, retain the approved local manifest, run `--self-test` and `--dry-run`, then launch only:

```powershell
$reviewSha = (git rev-parse HEAD).Trim()
node scripts/t070-signed-security-qa.mjs --resume-storage-delete-only --review-sha $reviewSha
```

At `before_signin`, `before_delete` and `after_delete`, run the **same exact read-only SQL above** in the trusted Preview project and enter only its fresh 18-count and 14-MD5 CSV values. The runner separately checks the original WebP SHA-256, the signed temporary Auth identity and zero temporary Admin memberships. Owner enters only the temporary password in local Chromium, and explicitly types `DELETE_APPROVED` at the single mutation checkpoint. No credentials, JWT, cookies, response bodies or private contact data enter the report. A precise JSON `AccessDenied` with HTTP 400 is accepted only after independent exact object persistence and unchanged metadata/baseline; any other 400 is UNVERIFIED. On unknown outcome, stop without retry and independently inspect the exact approved image UUID/path before any later action. The saved report records only new DELETE-only evidence; historical SELECT/PATCH/upload results remain in their separate records. No cleanup occurs.

## Final bounded P0 stage — implementation only (2026-10-13)

`--final-p0` is a **separate** finite execution branch. It never invokes the old `--execute`, `--resume-storage-only` or `--resume-storage-delete-only` branches. It does not repeat the signed non-admin PATCH, upload or DELETE. It does not provision fixtures, change memberships, run a successful Admin CRUD action or perform cleanup. The existing `.qa-local/t070/approved-fixtures.json` remains local and ignored; no new manifest is required. The immutable application Preview remains `https://marmix-flex-redesign-v2-preview-efx5iy5ej.vercel.app` at `f0a5522e766a7f203b75d50c0862c2619278161a`, distinct from the runner review HEAD.

**Current permission is implementation and noncredential dry-run only. Do not run `--final-p0` before a new Owner live-execution approval.** The safe Windows commands now are:

```powershell
git switch t070-preview-review
git pull --ff-only origin t070-preview-review
$reviewSha = (git rev-parse HEAD).Trim()
node scripts/t070-signed-security-qa.mjs --self-test
node scripts/t070-signed-security-qa.mjs --dry-run --review-sha $reviewSha
```

Only after a separate execution decision, the single bounded command would be `node scripts/t070-signed-security-qa.mjs --final-p0 --review-sha $reviewSha`. The Owner enters only the existing temporary password in the localhost Chromium form. No `--execute`, `--observe-expiry`, previous Storage resume, credentials or privileged key is needed. Dry-run contains no signed login or mutations. The local report remains `.qa-local/t070/security-signed.json` and must be retained privately, not committed.

The trusted operator runs the **same exact read-only 18-count/14-MD5 SQL above** immediately at each runner checkpoint. At `before_signin` and initial signed preflight, expected counts are `4,1,3,3,4,4,1,2,1,0,1,1,1,1,1,0,1,1`. At active checkpoints only `active_admins=2`, `temp_admin=1` change; at revoked checkpoints they are `1` and `1`. All 14 digests, including ten REAL digests and Owner membership digest, must stay exactly equal. The WebP SHA-256 is checked before sign-in and at final checkpoint. A mismatch stops the process; no result is inferred from a stale CSV.

| Checkpoint | Operation boundary | Separate Owner action |
|---|---|---|
| `before_signin` | Exact Preview/project/review SHA, immutable deployment, fixture digests, zero temporary membership and original WebP bytes. | Supply fresh trusted read-only CSV; no membership write. |
| `ACTIVE_APPROVED` → `ACTIVE_DONE` | Work/trusted Preview operator may add only the exact temporary UUID membership after explicit Owner approval in a future turn. Runner never writes it. Verify active Admins 2, temp membership 1 and unchanged REAL data. | Separate action-time Owner approval and independent SQL. |
| `after_active_reads`, `after_privacy` | Frozen signed bearer can see the exact TEST_ONLY product/order and one Storage object through read-only Storage LIST. Browser under the temporary Admin reads actual cache/robots headers; marker appears in authorized order detail, absent from the bounded anonymous pages/chunks/API. | Fresh SQL CSV; no write. The public scan is deliberately bounded and not a full PII audit. |
| `CSRF_WRONG_APPROVED`, `CSRF_MISSING_APPROVED` | Two **separate**, single-use POST attempts from the actual rendered TEST_ONLY Product Editor form. Node HTTP request uses the in-memory cookie jar, exact wrong Origin or no Origin. The form action is not guessed. The same trusted product/REAL digests are required before and after each. | Separate approval for *each* mutation attempt. Unexpected mutation or unknown response stops without retry. |
| `REVOKE_APPROVED` → `REVOKE_DONE` | Only temporary membership is deactivated through trusted Preview channel. Runner keeps the original signed token unchanged; Auth user endpoint must still accept it with expiry margin. Direct product/order SELECT and read-only Storage LIST must hide exact fixtures. Admin route must deny. | Separate action-time Owner approval, fresh active=1/temp=1 SQL, same REAL digests. |
| `final` | Recheck fixtures, WebP SHA-256 and unchanged REAL digests. | No cleanup in this runner. Fixture membership remains inactive pending separate cleanup authorization. |

Storage LIST is a read-only `POST /storage/v1/object/list/product-media` restricted to the exact TEST_ONLY folder. It requires the Storage SELECT policy; the publicly readable WebP bytes are **not** used as revoked-RLS proof. The limited signed traffic scan stores only marker booleans/counts and allowlisted header directives; authorized Admin responses may legitimately contain synthetic order fields, whereas anonymous responses must not contain the synthetic marker. No JWT, cookie, password, request/response body, private contact, HAR, screenshot or storageState is written to Git or the report.

The frozen JWT must remain valid after revocation. A timeout, absent action reference, unexpected HTTP result, incomplete browser traffic, expired original bearer or mismatching baseline leaves the affected verdict UNVERIFIED/FAIL and stops; the runner never retries. If an interruption occurs after activation or revocation, retain the exact UUID in the protected Owner handoff and recheck the membership through trusted Preview SQL. Do **not** restart the whole mode or repeat CSRF probes blindly. Natural expiry/refresh and Admin Create Product remain separate proposed acceptance exceptions, not PASS.

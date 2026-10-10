# T070 — локальный signed-session runner (implementation only)

**Статус:** код и mock-проверки подготовлены; live signed execution, TEST_ONLY fixtures и отрицательные mutation probes **не разрешены и не выполнялись**. T070 BLOCKED, T071 NOT STARTED. Runner привязан к Supabase Preview `twuevnwxwqdjbjzwuglm`, review-ветке `t070-preview-review` и неизменяемому приложению `https://marmix-flex-redesign-v2-preview-efx5iy5ej.vercel.app` (deployment `f0a5522e766a7f203b75d50c0862c2619278161a`). `--review-sha` относится к HEAD с runner; deployment SHA относится к проверяемому приложению. Перед live execution нужен новый Owner approval, проверка актуальности обоих SHA и точный fixture preflight.

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

`--execute` требует отдельного явного разрешения, чистой локальной review-ветки, точного remote HEAD и локального файла `.qa-local/t070/approved-fixtures.json` с одобренными только Preview UUID, путём одного WebP, исходными digest и одноразовым адресом `t070-…@example.invalid`. `--observe-expiry` использует отдельный `.qa-local/t070/approved-auth.json` и не доказывает refresh приложения; его следует рассматривать отдельно. Оба файла не созданы, не коммитятся и не должны содержать пароль или JWT. Строка `OWNER_APPROVED_T070_SIGNED_EXECUTION` в manifest — техническая защита от случайного запуска, **не** заменяет фактическое разрешение Owner или независимый baseline.

После будущего согласования Owner вводит пароль только в локальном Chromium окне на `127.0.0.1`. Runner не принимает password/JWT через CLI, env, URL или файл. Он проверяет exact Preview origin, CORS, CSP, Supabase project, review HEAD, fixture IDs, TEST_ONLY/unpublished state из manifest и требует отдельные ручные доверенные baseline/digest checkpoints. Одноразовые denied writes не повторяются после timeout. Обычные probe-запросы используют signed пользовательский bearer, не service_role. Browser context не сохраняется; трассировка, HAR, screenshot, video и storageState не пишутся. На уровне ОС нельзя гарантировать отсутствие paging/crash dump, как указано в [security design](T070_SIGNED_QA_DESIGN.md).

Анонимный маркер проверяется в отдельном browser context. Authenticated Admin route headers наблюдаются в контексте временного Admin, а не выводятся из source assertions. Полный traffic-level PII audit, весь набор JS chunks, естественный refresh приложения и подписанный Create Product workflow этим runner автоматически не подтверждаются. Кандидат на acceptance exception для Admin Create Product: **не создавать REAL ради QA**; штатный Create form → REAL RPC и его error/retry path остаются UNVERIFIED. Это предложение **не принято** до финального решения Owner.

При неопределённом outcome или изменении exact TEST_ONLY target остановить запуск, проверить exact ID/path через доверенный Preview read-only канал и согласовать восстановление. Никакой broad cleanup или повторного mutation запроса. Отчёт содержит только allowlisted status/count/verdict/cache directives и не содержит private response bodies, cookies, токенов, secrets, контактов, UUID fixtures или Storage path.

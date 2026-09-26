# Marmix Flex Redesign v2 — Implementation TASK Plan

**Статус:** план утверждён; T001–T010 — DONE, T011–T074 — TODO; M1 — PASS; M2 — PASS; Content Gate — BLOCKED after T010: four product-commerce groups and owner/legal sign-off remain. Owner-confirmed media rights/mapping are clear; selected-media visual quality review remains a pre-production requirement. Технический source of truth — [ARCHITECTURE.md](ARCHITECTURE.md), визуальный — [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). [CONTENT_AUDIT.md](CONTENT_AUDIT.md) фиксирует непроверенные бизнес-данные, [DESIGN_DIRECTIONS.md](DESIGN_DIRECTIONS.md) — историю утверждения, [prototype](../prototype/index.html) — approved visual reference. Этот документ не создаёт приложение, SQL, интеграции или production deployment.

**Порядок работы:** выполнять одну TASK за раз, в указанном порядке; перед ней читать этот пункт и только связанные источники/файлы, а не весь repository. Если нет нужных утверждённых данных — отметить конкретную задачу BLOCKED и запросить их. Если требуется смена архитектуры: остановиться, обосновать минимальную правку, дождаться разрешения, затем изменить ARCHITECTURE.md отдельным согласованным шагом. Если требуется изменение visual language: отдельное явное разрешение на DESIGN_SYSTEM.md и утверждённые компоненты. Никакая TASK не вправе самостоятельно изменять эти source of truth.

**Завершение каждой TASK:** implementation → её Required checks → один отдельный GitHub commit через официальный WRITE connector → fast-forward redesign-v2 → удалённая проверка SHA/изменённого файла → DONE и остановка. Не менять main, не force-push, не смешивать несколько завершённых TASK в commit. Предлагать новую TASK только по следующему запросу пользователя. Приведённое в каждой задаче сообщение commit — ориентир. Запрещено записывать реальные secrets, .env, PII или ключи в Git; .env.example содержит только placeholders.

**Приоритеты:** P0 — блокер ядра MVP; P1 — обязательное качество/интеграция для того же MVP; P2 зарезервирован для отдельного post-MVP плана и здесь не используется. P1 не означает разрешение выпустить MVP без неё. Дополнительный агент — NO для всех TASK: нет независимой работы, оправдывающей делегирование при последовательных gates. Максимум один агент, если это правило позже явно изменится.

**Проверки:** малая кодовая TASK — targeted lint, typecheck и relevant smoke; security/RLS — позитивные и негативные targeted проверки; milestone — интеграция готового этапа с предыдущим; полный e2e — ближе к candidate в PHASE 16. Документ/контент — фактчекинг и проверка ссылок/доказательств, без бессмысленного lint. Каждый критерий принимается по наблюдаемому результату.

## MVP required

Premium public homepage; подтверждённый каталог/категории/поиск/фильтры; Product Detail; корзина; заявка; Supabase; защищённые Admin Auth, товары, категории, фото и заявки; информационные и legal страницы; SEO foundation; Yandex Metrika; desktop/mobile/tablet, security и production QA. Supabase Studio — только technical/fallback, Custom Admin Panel — основной operational interface.

## Post-MVP (без TASK в этом плане)

Customer accounts, wishlist, comparison, online payment, advanced CMS, многоуровневый RBAC, BI, inventory ERP, page builder, тяжёлые animation. Расширение требует отдельного решения.

## Milestone gates

| Gate | После TASK | Условие приёмки |
|---|---|---|
| M1 — Foundation ready | T003 | Next scaffold, шрифты/tokens, lint/typecheck/build и HTTPS Preview работают; только placeholders в Git; проверить T001–T003. |
| M2 — Public visual foundation approved | T007 | Header/Hero/Showcase/Card/CTA в Next визуально совпадают с утверждённым prototype на 1440/390, mobile menu и reduced-motion проходят; принимать перенос, не новое направление; проверить T004–T007. |
| Content gate — **BLOCKED** | T010 | T010 and its media rights/mapping review are DONE. The gate remains blocked by four product-commerce groups (format for 14 flexible-board SKU; 20 range-price rules; commercial fields for 11 accessories; public slug collisions) and owner/legal sign-off in LEGAL_OWNER_DECISIONS.md. Selected-media quality review is a pre-production requirement, not a media rights/mapping blocker. Dependent commercial tasks remain blocked until gate clearance. |
| M3 — Supabase & Admin Auth secured | T022 | T011–T022: схемы, anon/RLS/Storage, закрытый signup, active membership, session/guard, негативные security проверки. |
| M4 — Admin catalog management operational | T038 | T023–T038: dashboard, Products/Categories CRUD в рамках разрешений, media upload/primary/delete и проверочный набор подтверждённых SKU через Admin; проверить интеграцию с M3. |
| M5 — Public catalog operational | T046 | T039–T046: списки/поиск/категории/Product Detail на общих данных, только published, реальные цена/медиа. Подключение add-to-cart является T049 и входит в M6. |
| M6 — Cart & Order flow operational | T055 | T047–T055: persistence, refresh цен, server validation, idempotency, одна приватная заявка и подтверждение; проверить вместе с M5. |
| M7 — Admin order management operational | T059 | T056–T059: статус/заметка в Admin; original snapshot не изменяем через UI и прямой authenticated API; интеграция с M6. |
| M8 — Production candidate | T074 | T060–T074: информационные страницы, SEO, Метрика, интеграционный QA и readiness; все M1–M7 пройдены, production не запущен. |

**M1 status: PASS.** T001–T003 DONE; lint/typecheck/build PASS, branch HTTPS Preview READY, Prata/Manrope/tokens PASS, owner visual smoke 1440 × 900 и 390 × 844 PASS; ошибочный deployment нового проекта удалён, существующий production не изменён.

**Content Gate status: BLOCKED after T010.** T008, T009 and T010 are DONE. Four product-commerce groups and owner/legal confirmation/sign-off remain. Media rights/mapping blockers are resolved by M1–M6; owner visual review of selected unique assets is still required before production, outside this Content Gate.

Gate проверяет только выполненную часть и её интеграцию с предыдущими. Утверждённый визуал сохраняется при M2; owner review касается точности переноса. Content gate обязателен до коммерческой реализации; непройденный gate блокирует зависящую задачу. M8 — готовность к отдельному разрешению на production, не деплой.

## PHASE 0 — Project Foundation

### T001 — Next.js foundation

- **ID:** T001
- **Priority:** P0
- **Status:** DONE
- **Title:** Next.js foundation
- **Goal:** Создать минимальное Next.js App Router приложение с TypeScript и проверяемым build.
- **Why:** Все остальные production TASK требуют единой основы.
- **Dependencies:** нет (старт проекта).
- **Allowed scope:** package/scripts, src/app и пустой page/layout; gitignore.
- **Forbidden scope:** Перенос prototype, Supabase и новые страницы. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md.
- **Implementation notes:** Стабильные версии выбрать при создании, без лишнего framework.
- **Acceptance criteria:** Build, typecheck, lint проходят; стартовая страница открывается.
- **Required checks:** lint, typecheck, build и localhost smoke.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T001): Next.js foundation

### T002 — Tokens, CSS Modules и шрифты

- **ID:** T002
- **Priority:** P0
- **Status:** DONE
- **Title:** Tokens, CSS Modules и шрифты
- **Goal:** Зафиксировать в приложении утверждённые токены и локальные Prata/Manrope.
- **Why:** Визуальный перенос должен начинаться с точных основ.
- **Dependencies:** T001.
- **Allowed scope:** tokens.css, global.css, next/font/local после проверки лицензии, минимальная типографика.
- **Forbidden scope:** Редизайн компонентов и подмена палитры. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md.
- **Implementation notes:** Сверить CSS с DESIGN_SYSTEM; fallback без скачка компоновки.
- **Acceptance criteria:** Токены и шрифты подключены к тестовой странице; lint/typecheck/build проходят. Визуальный smoke 1440/390 обязателен в T003 на HTTPS Preview.
- **Required checks:** lint, typecheck, build, локальная проверка шрифтов.
- **Note:** Visual smoke 1440/390 deferred to T003 HTTPS Preview due environment limitation; lint/typecheck/build passed.
- **Resolution:** Owner visual smoke HTTPS Preview на 1440 × 900 и 390 × 844 PASS в T003; отложенная проверка закрыта.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T002): Tokens, CSS Modules и шрифты

### T003 — Preview и безопасный env baseline

- **ID:** T003
- **Priority:** P0
- **Status:** DONE
- **Title:** Preview и безопасный env baseline
- **Goal:** Настроить GitHub branch Preview и шаблон переменных без значений.
- **Why:** Каждый этап нуждается в проверяемой HTTPS среде и безопасном конфиге.
- **Dependencies:** T002.
- **Allowed scope:** Vercel Preview конфигурация, env.example placeholders, base metadata.
- **Forbidden scope:** Production deploy, реальные ключи в Git, Supabase подключение. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md.
- **Implementation notes:** Preview от redesign-v2, закрыть индексирование до запуска.
- **Acceptance criteria:** Preview открывается; foundation T002 проверена при 1440/390; env.example не содержит secrets, production не затронут.
- **Required checks:** lint/typecheck, HTTPS smoke, secret-path review; обязательно через HTTPS Preview проверить Prata loaded, Manrope loaded, tokens applied, 1440px visual smoke, 390px visual smoke, no CSS/font console errors.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Verification note:** Lint/typecheck/build PASS; безопасный .env.example и временный noindex. HTTPS Preview связан с redesign-v2; Prata/Manrope/CSS и отсутствие ошибок страницы проверены в браузере. Owner visual smoke 1440 × 900 и 390 × 844 PASS (включая кириллицу, палитру и отсутствие horizontal overflow). Случайно созданный Production deployment отдельного Preview-проекта удалён с разрешения владельца; существующий production не менялся.
- **Suggested commit message:** task(T003): Preview и безопасный env baseline


## PHASE 1 — Public Visual Foundation

### T004 — Public layout, Header и Footer

- **ID:** T004
- **Priority:** P0
- **Status:** DONE
- **Title:** Public layout, Header и Footer
- **Goal:** Перенести approved публичную оболочку, включая мобильное меню.
- **Why:** Это общая композиция всех страниц.
- **Dependencies:** T003.
- **Allowed scope:** Root layout, Header/nav/mobile menu/Footer и их CSS.
- **Forbidden scope:** Пересмотр Header, business content без подтверждения. Не начинать соседнюю TASK.
- **Source of truth:** docs/DESIGN_SYSTEM.md; prototype/index.html, styles.css, script.js, assets; docs/ARCHITECTURE.md.
- **Implementation notes:** Ссылки на будущие routes могут иметь ясное временное состояние, без пустых href.
- **Acceptance criteria:** Desktop/mobile повторяют prototype, меню работает с клавиатурой.
- **Required checks:** lint, typecheck, browser smoke 1440/390.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Verification note:** Implementation commit a166973c038834388c500c9e3d74d0fa86000eb5; lint/typecheck/build PASS, HTTPS branch Preview READY. Владелец проверил Chrome Responsive Mode: 1440 × 900, 768 × 900, 390 × 844 — PASS; Header/Footer, отсутствие overflow, mobile open/close, Escape, Tab, focus и ссылки — PASS. Console ошибок приложения не показала.
- **Suggested commit message:** task(T004): Public layout, Header и Footer

### T005 — Hero и Material Showcase

- **ID:** T005
- **Priority:** P0
- **Status:** DONE
- **Title:** Hero и Material Showcase
- **Goal:** Перенести две ведущие сцены prototype в Next компоненты.
- **Why:** Они задают утверждённый визуальный язык.
- **Dependencies:** T004.
- **Allowed scope:** Hero/Showcase, утверждённые assets и image sizes.
- **Forbidden scope:** Новые рендеры, вымышленные товарные свойства. Не начинать соседнюю TASK.
- **Source of truth:** docs/DESIGN_SYSTEM.md; prototype/index.html, styles.css, script.js, assets; docs/ARCHITECTURE.md.
- **Implementation notes:** Демо кадры пометить презентационными до content gate.
- **Acceptance criteria:** Композиция и кадрирование сопоставимы с prototype на 1440/390.
- **Required checks:** lint, typecheck, визуальный smoke, assets loaded.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T005): Hero и Material Showcase

### T006 — Home fragments и UI primitives

- **ID:** T006
- **Priority:** P0
- **Status:** DONE
- **Title:** Home fragments и UI primitives
- **Goal:** Перенести фрагмент каталога, Product Card, application block и CTA.
- **Why:** Home должен быть целостным visual reference.
- **Dependencies:** T005.
- **Allowed scope:** Кнопки/ссылки/карточка/CTA как фактически утверждены.
- **Forbidden scope:** Реальная покупка, новая homepage или декоративные generic cards. Не начинать соседнюю TASK.
- **Source of truth:** docs/DESIGN_SYSTEM.md; prototype/index.html, styles.css, script.js, assets; docs/ARCHITECTURE.md.
- **Implementation notes:** Price/CTA демо состояния не выдавать за реальные продажи.
- **Acceptance criteria:** Те же блоки и иерархия, нет ложных коммерческих данных.
- **Required checks:** lint, typecheck, desktop/mobile smoke.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T006): Home fragments и UI primitives

### T007 — Responsive и motion parity

- **ID:** T007
- **Priority:** P1
- **Status:** DONE
- **Title:** Responsive и motion parity
- **Goal:** Проверить публичную основу на ширинах и reduced motion.
- **Why:** Перенос может незаметно сломать mobile или анимацию.
- **Dependencies:** T006.
- **Allowed scope:** CSS fixes по фактическим несовпадениям, a11y motion.
- **Forbidden scope:** Новый art direction и дополнительные секции. Не начинать соседнюю TASK.
- **Source of truth:** docs/DESIGN_SYSTEM.md; prototype/index.html, styles.css, script.js, assets; docs/ARCHITECTURE.md.
- **Implementation notes:** Сравнение с prototype 1440/390; tablet, overflow, console.
- **Acceptance criteria:** Контент виден без JS, нет overflow и ошибок, reduced motion работает.
- **Required checks:** targeted lint/typecheck, browser viewport/console smoke.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T007): Responsive и motion parity


## PHASE 2 — Content & Media Gate

### T008 — Подтверждение товарного справочника

- **ID:** T008
- **Priority:** P0
- **Status:** DONE
- **Title:** Подтверждение товарного справочника
- **Goal:** Сверить SKU, декоры, категории, единицы, шаг, размер, свойства и статусы.
- **Why:** Нельзя строить продажу на демонстрационном прайсе.
- **Dependencies:** T007.
- **Allowed scope:** Верифицированный реестр данных/источников и открытые вопросы без реализации.
- **Forbidden scope:** Создание товаров в БД, предположения о ценах. Не начинать соседнюю TASK.
- **Source of truth:** docs/CONTENT_AUDIT.md; docs/DESIGN_DIRECTIONS.md; docs/ARCHITECTURE.md.
- **Implementation notes:** Создать docs/CONTENT_FACTS.md: approved launch SKU set, источник/дата каждого значения и sign-off.
- **Acceptance criteria:** Есть согласованный реестр SKU и обязательных полей либо явный BLOCKED список.
- **Required checks:** Сверка выборки с бизнес-источником, без кода.
- **Recommended model:** GPT-6 Luna Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Verification note:** Acceptance criteria выполнены: владелец подтвердил 251 INCLUDE, 251 стабильный SKU, 8 категорий, 231 фиксированную цену, 226 панельных размеров 142 × 284 см / 4.0328 м², правила цены/количества для поверхностей, две разные «Калаката», срок службы 30 лет и availability policy. Четыре конкретных unresolved commercial/routing blocker оставлены в [CATALOG_OWNER_DECISIONS.md](CATALOG_OWNER_DECISIONS.md#remaining-blockers) и блокируют общий Content Gate, но не T008 — здесь зафиксирован явный BLOCKED список. T009 documentation was subsequently completed; T010 remains TODO and is not started automatically.
- **Suggested commit message:** task(T008): Подтверждение товарного справочника

### T009 — Условия заказа и юридический контент

- **ID:** T009
- **Priority:** P0
- **Status:** DONE
- **Title:** Условия заказа и юридический контент
- **Goal:** Подтвердить контакты, доставку, возврат, цену/оплату, согласие.
- **Why:** Checkout и публичные страницы требуют доказуемых условий.
- **Dependencies:** T008.
- **Allowed scope:** Документировать утверждённые факты и ответственное лицо.
- **Forbidden scope:** Выдуманные обещания, production legal без согласования. Не начинать соседнюю TASK.
- **Source of truth:** docs/CONTENT_AUDIT.md; docs/DESIGN_DIRECTIONS.md; docs/ARCHITECTURE.md.
- **Implementation notes:** Дополнить docs/CONTENT_FACTS.md подтверждёнными условиями и текстом согласия.
- **Acceptance criteria:** Все обязательные поля/тексты подтверждены либо gate заблокирован.
- **Required checks:** Фактчекинг и sign-off содержания, без кода.
- **Recommended model:** GPT-6 Luna Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T009): Условия заказа и юридический контент

### T010 — Медиа: соответствие и права

- **ID:** T010
- **Priority:** P0
- **Status:** DONE
- **Title:** Медиа: соответствие и права
- **Goal:** Составить manifest реальных texture/macro/interior кадров и прав.
- **Why:** Без достоверного фото showroom вводит в заблуждение.
- **Dependencies:** T009.
- **Allowed scope:** Сопоставление SKU→файлы, alt факты, license/permission.
- **Forbidden scope:** Генерация «реальных проектов», импорт в Storage. Не начинать соседнюю TASK.
- **Source of truth:** docs/CONTENT_AUDIT.md; docs/DESIGN_DIRECTIONS.md; docs/ARCHITECTURE.md.
- **Implementation notes:** Дополнить docs/CONTENT_FACTS.md media manifest с правами, SKU и различием проекта/визуализации.
- **Acceptance criteria:** Для продаваемых SKU известен primary и право использования либо BLOCKED.
- **Required checks:** Проверка источника/прав/разрешений, без кода.
- **Recommended model:** GPT-6 Luna Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T010): Медиа: соответствие и права


## PHASE 3 — Supabase Foundation

### T011 — Supabase Preview environment

- **ID:** T011
- **Priority:** P0
- **Status:** TODO
- **Title:** Supabase Preview environment
- **Goal:** Подготовить изолированный тестовый проект и безопасные env.
- **Why:** Schema и Auth требуют защищённого окружения.
- **Dependencies:** T010; Content gate после T010.
- **Allowed scope:** Только Preview project, переменные в защищённом хранилище.
- **Forbidden scope:** Production project, реальные секреты в Git, seed. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; утверждённый content gate docs/CONTENT_FACTS.md (T008–T010).
- **Implementation notes:** Применить условия content gate; публичный URL и publishable key не secret.
- **Acceptance criteria:** Preview env доступен серверу, production изолирован.
- **Required checks:** env exposure check, connection smoke без PII.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T011): Supabase Preview environment

### T012 — Schema каталога и индексы

- **ID:** T012
- **Priority:** P0
- **Status:** TODO
- **Title:** Schema каталога и индексы
- **Goal:** Создать categories/products/product_images под утверждённую модель SKU.
- **Why:** Admin и витрина должны разделять одну модель.
- **Dependencies:** T011.
- **Allowed scope:** Миграция таблиц, checks/uniques/FK/indexes.
- **Forbidden scope:** Order schema, seed, UI, Auth. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; утверждённый content gate docs/CONTENT_FACTS.md (T008–T010).
- **Implementation notes:** Единица и шаг продажи по T008; slug/SKU уникальны, primary уникален.
- **Acceptance criteria:** Миграция воспроизводима; ограничения отклоняют некорректный SKU/цену.
- **Required checks:** migration check, targeted DB constraints.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T012): Schema каталога и индексы

### T013 — Schema заявки и неизменяемость

- **ID:** T013
- **Priority:** P0
- **Status:** TODO
- **Title:** Schema заявки и неизменяемость
- **Goal:** Создать order_requests со snapshot, статусами и разрешёнными update columns.
- **Why:** Заявка должна сохранять исходную цену навсегда.
- **Dependencies:** T012.
- **Allowed scope:** Таблица, idempotency uniqueness, updated_at, grants.
- **Forbidden scope:** Checkout API, admin UI, order_items без нужды. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; утверждённый content gate docs/CONTENT_FACTS.md (T008–T010).
- **Implementation notes:** Column UPDATE только status/internal_note; коммерческие поля immutable.
- **Acceptance criteria:** DB отвергает изменение суммы/строк authenticated ролью.
- **Required checks:** migration check, negative column privilege tests.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T013): Schema заявки и неизменяемость

### T014 — RLS публикации и приватности

- **ID:** T014
- **Priority:** P0
- **Status:** TODO
- **Title:** RLS публикации и приватности
- **Goal:** Добавить публичные read policies и закрыть заявки.
- **Why:** Прямая Data API не должна обходить сайт.
- **Dependencies:** T013.
- **Allowed scope:** RLS/grants для каталога и заказов.
- **Forbidden scope:** Admin policies до membership, seed, frontend. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; утверждённый content gate docs/CONTENT_FACTS.md (T008–T010).
- **Implementation notes:** Проверить связи продукт↔категория↔изображение.
- **Acceptance criteria:** anon видит только опубликованное и не читает/меняет orders.
- **Required checks:** targeted anon/authenticated denial tests.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T014): RLS публикации и приватности

### T015 — Storage bucket baseline

- **ID:** T015
- **Priority:** P0
- **Status:** TODO
- **Title:** Storage bucket baseline
- **Goal:** Создать product media bucket и начальные ограничения.
- **Why:** Image delivery зависит от безопасного хранения.
- **Dependencies:** T014.
- **Allowed scope:** Bucket MIME/size, публичный read, запрет публичных mutations.
- **Forbidden scope:** Admin upload UI и admin Storage write policies. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; утверждённый content gate docs/CONTENT_FACTS.md (T008–T010).
- **Implementation notes:** Не загружать неподтверждённые кадры; ключи и префиксы фиксированы.
- **Acceptance criteria:** anon может читать разрешённый asset, не может upload/delete.
- **Required checks:** Storage policy negative tests.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T015): Storage bucket baseline

### T016 — Server clients и env boundary

- **ID:** T016
- **Priority:** P0
- **Status:** TODO
- **Title:** Server clients и env boundary
- **Goal:** Реализовать отдельные public и secret Supabase clients.
- **Why:** Secret нужен только публичному endpoint заявки.
- **Dependencies:** T015.
- **Allowed scope:** server-only clients, конфиг, типы ошибок, проверка env.
- **Forbidden scope:** Order endpoint, auth, браузерный secret. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; утверждённый content gate docs/CONTENT_FACTS.md (T008–T010).
- **Implementation notes:** Public read всегда без admin cookies; secret client не экспортировать в client.
- **Acceptance criteria:** Build не включает secret; anon/secret boundaries проверены.
- **Required checks:** typecheck, bundle boundary, targeted DB smoke.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T016): Server clients и env boundary


## PHASE 4 — Admin Authentication

### T017 — admin_users и admin RLS

- **ID:** T017
- **Priority:** P0
- **Status:** TODO
- **Title:** admin_users и admin RLS
- **Goal:** Создать единую таблицу допуска админов и политики membership.
- **Why:** Auth account сам по себе не даёт прав.
- **Dependencies:** T016.
- **Allowed scope:** Миграция admin_users, SELECT own, deny self-write, RLS админских таблиц.
- **Forbidden scope:** Login UI, новые роли, public signup. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md.
- **Implementation notes:** Order UPDATE только status/internal_note; catalogue CRUD только active admin.
- **Acceptance criteria:** Не-admin authenticated не видит заявки/черновики и не меняет каталог.
- **Required checks:** RLS negative/positive tests.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T017): admin_users и admin RLS

### T018 — Auth config и первый admin

- **ID:** T018
- **Priority:** P0
- **Status:** TODO
- **Title:** Auth config и первый admin
- **Goal:** Отключить регистрацию и безопасно завести первого владельца.
- **Why:** Любой посетитель не должен создавать admin account.
- **Dependencies:** T017.
- **Allowed scope:** Email/password config, ручной invite/create и membership в Preview.
- **Forbidden scope:** Публичная форма sign-up, production credentials. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md.
- **Implementation notes:** Account создаёт владелец техническим каналом, без секрета в commit.
- **Acceptance criteria:** Sign-up отклоняется; только внесённый UUID имеет membership.
- **Required checks:** signup denial, login/admin membership smoke.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T018): Auth config и первый admin

### T019 — SSR session refresh

- **ID:** T019
- **Priority:** P0
- **Status:** TODO
- **Title:** SSR session refresh
- **Goal:** Настроить cookie-based Auth и обновление session на /admin.
- **Why:** Admin должен сохранять session без доверия к client state.
- **Dependencies:** T018.
- **Allowed scope:** @supabase/ssr, proxy/middleware по версии Next.
- **Forbidden scope:** Авторизация по getSession без верификации, public auth. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md.
- **Implementation notes:** No-store на admin HTML/Set-Cookie, корректный refresh.
- **Acceptance criteria:** Valid session обновляется; истёкшая не раскрывает данные.
- **Required checks:** auth session integration, cache header check.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T019): SSR session refresh

### T020 — Admin login и logout

- **ID:** T020
- **Priority:** P0
- **Status:** TODO
- **Title:** Admin login и logout
- **Goal:** Реализовать вход/выход и сообщения об ошибке без enumeration.
- **Why:** Владелец должен управлять доступом с рабочих устройств.
- **Dependencies:** T019.
- **Allowed scope:** /admin/login, password flow, signOut, безопасный redirect.
- **Forbidden scope:** Registration, password в логах, Admin shell. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md.
- **Implementation notes:** После входа проверять active membership; non-admin signOut.
- **Acceptance criteria:** Admin входит/выходит; non-admin не проходит, ошибке нет PII.
- **Required checks:** login/logout browser smoke и негативный auth тест.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T020): Admin login и logout

### T021 — requireAdmin и guard mutations

- **ID:** T021
- **Priority:** P0
- **Status:** TODO
- **Title:** requireAdmin и guard mutations
- **Goal:** Защитить /admin/* и шаблон всех будущих Server Actions.
- **Why:** Guard в layout не защищает прямой вызов mutation.
- **Dependencies:** T020.
- **Allowed scope:** Server requireAdmin, layout guard, origin/session checks.
- **Forbidden scope:** Обход RLS secret client, UI-only role check. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md.
- **Implementation notes:** getUser + membership при каждом действии; redirect только локальный.
- **Acceptance criteria:** Без активной session любой admin route/action отказан.
- **Required checks:** direct action denial, expired/revoked tests.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T021): requireAdmin и guard mutations

### T022 — Admin Auth security gate

- **ID:** T022
- **Priority:** P0
- **Status:** TODO
- **Title:** Admin Auth security gate
- **Goal:** Проверить регистрацию, отзыв роли, сессию и все права.
- **Why:** Перед CRUD нужен доказанный security baseline.
- **Dependencies:** T021.
- **Allowed scope:** Только targeted auth/RLS/CSRF/Storage denial scenarios.
- **Forbidden scope:** Admin UI или новые роли. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md.
- **Implementation notes:** Проверить прямые PostgREST запросы под anon и non-admin.
- **Acceptance criteria:** Все негативные сценарии закрыты; M3 можно принимать.
- **Required checks:** security integration suite и remote Preview smoke.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T022): Admin Auth security gate


## PHASE 5 — Admin Shell

### T023 — Admin shell и навигация

- **ID:** T023
- **Priority:** P0
- **Status:** TODO
- **Title:** Admin shell и навигация
- **Goal:** Сделать рабочий layout Marmix Flex для /admin.
- **Why:** Операции требуют понятной навигации без showroom декора.
- **Dependencies:** T022.
- **Allowed scope:** Desktop/tablet/phone shell, menu, logout affordance.
- **Forbidden scope:** Redesign публичных компонентов и data mutations. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md.
- **Implementation notes:** Manrope, graphite, restrained gold и явное активное меню.
- **Acceptance criteria:** Защищённые маршруты доступны с keyboard; mobile usable.
- **Required checks:** lint, typecheck, viewport smoke.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T023): Admin shell и навигация

### T024 — Operational dashboard

- **ID:** T024
- **Priority:** P0
- **Status:** TODO
- **Title:** Operational dashboard
- **Goal:** Вывести новые/в работе заявки и опубликованные/скрытые товары.
- **Why:** Владелец должен видеть очередь и состояние каталога.
- **Dependencies:** T023.
- **Allowed scope:** Серверные count queries под admin RLS, переходы в списки.
- **Forbidden scope:** BI графики, клиентский secret. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md.
- **Implementation notes:** Отдельно обозначать архивные и неопубликованные товары.
- **Acceptance criteria:** Счётчики согласованы с данными; ссылки ведут в разделы.
- **Required checks:** targeted count integration, lint/typecheck.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T024): Operational dashboard

### T025 — Admin states и responsive

- **ID:** T025
- **Priority:** P1
- **Status:** TODO
- **Title:** Admin states и responsive
- **Goal:** Добавить loading/error/empty и проверить рабочие ширины.
- **Why:** Операционный интерфейс должен быть понятен при сбое.
- **Dependencies:** T024.
- **Allowed scope:** UI состояния Admin shell/dashboard, desktop/tablet/phone.
- **Forbidden scope:** Новые функции каталога или orders. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md.
- **Implementation notes:** Без кэширования PII; работа мышью и клавиатурой.
- **Acceptance criteria:** Нет пустого немого экрана, overflow и ошибок консоли.
- **Required checks:** browser smoke 1440/tablet/390, lint/typecheck.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T025): Admin states и responsive


## PHASE 6 — Admin Catalog Management

### T026 — Products list

- **ID:** T026
- **Priority:** P0
- **Status:** TODO
- **Title:** Products list
- **Goal:** Создать /admin/products с видимым статусом и ключевыми полями.
- **Why:** Операции начинаются с обзора SKU.
- **Dependencies:** T025.
- **Allowed scope:** Server list, колонки SKU/name/category/price/status.
- **Forbidden scope:** Формы редактирования и публичная витрина. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/CONTENT_FACTS.md (T008).
- **Implementation notes:** Никаких PII, no-store; чтение только active admin.
- **Acceptance criteria:** Список различает published/unpublished/archived.
- **Required checks:** lint, typecheck, guarded list smoke.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T026): Products list

### T027 — Products search и filters

- **ID:** T027
- **Priority:** P0
- **Status:** TODO
- **Title:** Products search и filters
- **Goal:** Добавить поиск/фильтры/сортировку списка товаров.
- **Why:** Каталогом невозможно управлять без нахождения SKU.
- **Dependencies:** T026.
- **Allowed scope:** GET параметры для admin списка, pagination.
- **Forbidden scope:** Public catalog filters и новые атрибуты. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/CONTENT_FACTS.md (T008).
- **Implementation notes:** Whitelist параметров, не грузить все товары в browser.
- **Acceptance criteria:** Фильтр по SKU/статусу/категории и дата/порядок работают.
- **Required checks:** targeted query tests, browser smoke.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T027): Products search и filters

### T028 — Create product

- **ID:** T028
- **Priority:** P0
- **Status:** TODO
- **Title:** Create product
- **Goal:** Создать SKU через защищённую форму.
- **Why:** Admin Panel — основной способ наполнения каталога.
- **Dependencies:** T027.
- **Allowed scope:** name/slug/SKU/category/series/price/unit/min/step и draft save.
- **Forbidden scope:** Загрузка изображений, публикация без проверенных данных. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/CONTENT_FACTS.md (T008).
- **Implementation notes:** Серверная валидация, DB constraints, initial unpublished.
- **Acceptance criteria:** Новый draft появляется в admin, anon его не видит.
- **Required checks:** form/action validation, RLS denial, lint/typecheck.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T028): Create product

### T029 — Edit product properties

- **ID:** T029
- **Priority:** P0
- **Status:** TODO
- **Title:** Edit product properties
- **Goal:** Редактировать описание, размеры, specs, attributes и SEO.
- **Why:** Товар должен обслуживаться без Studio.
- **Dependencies:** T028.
- **Allowed scope:** Форма и action для полей одной products row.
- **Forbidden scope:** Image operations, schema change. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/CONTENT_FACTS.md (T008).
- **Implementation notes:** Проверять контролируемые значения и права admin перед save.
- **Acceptance criteria:** После reload сохраняются поля, неверные данные отклонены.
- **Required checks:** targeted mutation/validation, lint/typecheck.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T029): Edit product properties

### T030 — Publication и assortment states

- **ID:** T030
- **Priority:** P0
- **Status:** TODO
- **Title:** Publication и assortment states
- **Goal:** Дать unpublish/restore/archive, featured, availability и sort order.
- **Why:** Публикация должна быть управляемой и обратимой.
- **Dependencies:** T029.
- **Allowed scope:** Операции над текущими products, подтверждение при архиве.
- **Forbidden scope:** Physical delete, inventory ERP. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/CONTENT_FACTS.md (T008).
- **Implementation notes:** Архивный SKU не публиковать; slug опубликованного SKU неизменен до согласованного redirect механизма; revalidate public.
- **Acceptance criteria:** Статусы и порядок отражаются в админке и RLS; удалений нет.
- **Required checks:** targeted state/RLS tests, lint/typecheck.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T030): Publication и assortment states

### T031 — Category management

- **ID:** T031
- **Priority:** P0
- **Status:** TODO
- **Title:** Category management
- **Goal:** Создать список и create/edit категорий.
- **Why:** Admin должен управлять навигацией каталога.
- **Dependencies:** T030.
- **Allowed scope:** /admin/categories, title/slug/description/sort/SEO/status.
- **Forbidden scope:** Nested taxonomy, удаление используемой категории. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/CONTENT_FACTS.md (T008).
- **Implementation notes:** Валидация slug и дубликатов; draft status.
- **Acceptance criteria:** Категория создаётся/меняется из Admin, anon видит только published.
- **Required checks:** action validation, guarded route smoke.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T031): Category management

### T032 — Category publication behavior

- **ID:** T032
- **Priority:** P0
- **Status:** TODO
- **Title:** Category publication behavior
- **Goal:** Закрепить видимость дочерних SKU и предупреждения.
- **Why:** Скрытие категории влияет на все продукты.
- **Dependencies:** T031.
- **Allowed scope:** UI count affected, unpublish/republish confirmation, redirect note.
- **Forbidden scope:** Каскадное удаление, молчаливая смена URL. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/CONTENT_FACTS.md (T008).
- **Implementation notes:** Подчинённые is_published не менять; public RLS скрывает category; slug опубликованной категории не менять без redirect механизма.
- **Acceptance criteria:** Скрытые товары исчезают, затем возвращаются по правилу; данные сохранены.
- **Required checks:** category/product visibility integration.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T032): Category publication behavior


## PHASE 7 — Admin Media Management

### T033 — Admin Storage policies

- **ID:** T033
- **Priority:** P0
- **Status:** TODO
- **Title:** Admin Storage policies
- **Goal:** Разрешить media операции только активному admin.
- **Why:** Browser upload должен работать без secret.
- **Dependencies:** T032.
- **Allowed scope:** INSERT/SELECT/DELETE policies в бакете и допустимом префиксе.
- **Forbidden scope:** Публичный upload, произвольные пути, secret в browser. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md; docs/CONTENT_FACTS.md (T010).
- **Implementation notes:** Проверить allowlist MIME/size и отсутствие перезаписи.
- **Acceptance criteria:** anon/non-admin не загружает/удаляет; admin может.
- **Required checks:** Storage RLS positive/negative tests.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T033): Admin Storage policies

### T034 — Media upload и preview

- **ID:** T034
- **Priority:** P0
- **Status:** TODO
- **Title:** Media upload и preview
- **Goal:** Добавить загрузку и предпросмотр в Product Editor.
- **Why:** Редактор не должен вводить Storage paths.
- **Dependencies:** T033.
- **Allowed scope:** Client admin Auth upload, safe generated path, preview/validation.
- **Forbidden scope:** Каталог image gallery, новые media buckets. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md; docs/CONTENT_FACTS.md (T010).
- **Implementation notes:** Проверять размер, формат, права; ошибку upload показать.
- **Acceptance criteria:** Фото загрузилось и привязалось к нужному SKU; путь скрыт от UI.
- **Required checks:** upload smoke, typecheck, policy denial.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T034): Media upload и preview

### T035 — Image metadata и primary

- **ID:** T035
- **Priority:** P0
- **Status:** TODO
- **Title:** Image metadata и primary
- **Goal:** Редактировать alt/role/order/primary для изображений товара.
- **Why:** Фактуры и интерьер имеют разную семантику.
- **Dependencies:** T034.
- **Allowed scope:** product_images mutation, reorder, one primary.
- **Forbidden scope:** Автоматическое сочинение alt/характеристик. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md; docs/CONTENT_FACTS.md (T010).
- **Implementation notes:** Нейтральный образец primary; учитывать дизайн-систему.
- **Acceptance criteria:** После reload порядок и primary сохраняются, публикация требует primary.
- **Required checks:** targeted DB constraint and editor smoke.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T035): Image metadata и primary

### T036 — Safe image removal

- **ID:** T036
- **Priority:** P0
- **Status:** TODO
- **Title:** Safe image removal
- **Goal:** Удалять медиа без битых публичных ссылок.
- **Why:** Storage и таблица изменяются раздельно.
- **Dependencies:** T035.
- **Allowed scope:** detach→Storage delete, предупреждение и retry orphan cleanup.
- **Forbidden scope:** Удаление единственного primary опубликованного SKU. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md; docs/CONTENT_FACTS.md (T010).
- **Implementation notes:** Проверять принадлежность path/product, подтверждать удаление.
- **Acceptance criteria:** После удаления публичный кадр не битый; отказ оставляет ясное состояние.
- **Required checks:** failure-mode smoke, Storage policy tests.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T036): Safe image removal

### T037 — Media presentation verification

- **ID:** T037
- **Priority:** P1
- **Status:** TODO
- **Title:** Media presentation verification
- **Goal:** Проверить фактуру, кадры и производительность медиа.
- **Why:** Dark Gold Showroom зависит от правдоподобного материала.
- **Dependencies:** T036.
- **Allowed scope:** Next/Image sizes/remotePatterns/crops/lazy/LCP review.
- **Forbidden scope:** Изменение палитры или цвета продукта. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md; docs/CONTENT_FACTS.md (T010).
- **Implementation notes:** Сопоставить нейтральный продуктовый кадр с manifest.
- **Acceptance criteria:** 1440/390 фото корректны, права и alt проверены.
- **Required checks:** image network/console smoke, target performance.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T037): Media presentation verification

### T038 — Verified catalog population

- **ID:** T038
- **Priority:** P0
- **Status:** TODO
- **Title:** Verified catalog population
- **Goal:** Ввести небольшой проверочный набор утверждённых SKU через Admin Panel.
- **Why:** M4 требует проверить реальные операции на настоящих данных.
- **Dependencies:** T037.
- **Allowed scope:** Небольшой проверочный набор из docs/CONTENT_FACTS.md через Admin в Preview; полный launch ассортимент сверять на T072.
- **Forbidden scope:** Прямой seed без причины, вымышленные цены. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md; docs/CONTENT_FACTS.md (T008–T010).
- **Implementation notes:** Использовать формы admin; полный ассортимент для запуска владелец вводит операционно, его полноту проверяет T072.
- **Acceptance criteria:** Проверенный набор товаров доступен, публикация и media работают.
- **Required checks:** выборочная сверка реестра↔admin↔public read.
- **Recommended model:** GPT-6 Luna Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T038): Verified catalog population


## PHASE 8 — Public Catalog

### T039 — Public catalog read layer

- **ID:** T039
- **Priority:** P0
- **Status:** TODO
- **Title:** Public catalog read layer
- **Goal:** Создать server queries для опубликованных SKU/категорий.
- **Why:** Одна модель должна кормить все публичные страницы.
- **Dependencies:** T038.
- **Allowed scope:** list/get/facets, типы, безопасные query params.
- **Forbidden scope:** Прямой browser доступ к order_requests, UI. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md; docs/CONTENT_FACTS.md (T008–T010).
- **Implementation notes:** Public client не переносит admin cookies, cache явный.
- **Acceptance criteria:** Queries возвращают только опубликованное и валидный sort/page.
- **Required checks:** targeted query/RLS integration, typecheck.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T039): Public catalog read layer

### T040 — Catalog и category routes

- **ID:** T040
- **Priority:** P0
- **Status:** TODO
- **Title:** Catalog и category routes
- **Goal:** Реализовать /catalog и /catalog/[category] на сервере.
- **Why:** Каталог и категория — базовые маршруты магазина.
- **Dependencies:** T039.
- **Allowed scope:** ProductGrid, category summary, breadcrumb, 404.
- **Forbidden scope:** Product Detail, cart, новые категории. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md; docs/CONTENT_FACTS.md (T008–T010).
- **Implementation notes:** Утверждённый Card/spacing; данные из T039.
- **Acceptance criteria:** Оба route показывают только visible SKU, несуществующий slug 404.
- **Required checks:** lint/typecheck, route smoke.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T040): Catalog и category routes

### T041 — Search/filters/sort/pagination

- **ID:** T041
- **Priority:** P0
- **Status:** TODO
- **Title:** Search/filters/sort/pagination
- **Goal:** Реализовать каталоговые выборки по реальным данным.
- **Why:** Посетитель должен находить и сравнивать материалы.
- **Dependencies:** T040.
- **Allowed scope:** GET URL q/price/status/verified facets/sort/page.
- **Forbidden scope:** Декоративные фильтры и поиск отдельным сервисом. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md; docs/CONTENT_FACTS.md (T008–T010).
- **Implementation notes:** Пустые значения не показывать, whitelist URL, browser back.
- **Acceptance criteria:** Комбинации воспроизводимы URL и не показывают hidden SKU.
- **Required checks:** targeted query tests, 1440/390 smoke.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T041): Search/filters/sort/pagination

### T042 — Catalog states и responsive

- **ID:** T042
- **Priority:** P1
- **Status:** TODO
- **Title:** Catalog states и responsive
- **Goal:** Завершить карточки/empty/loading/error в каталоге.
- **Why:** Отказ и пустая выдача должны объясняться.
- **Dependencies:** T041.
- **Allowed scope:** Product Card с ценой/единицей, один столбец mobile.
- **Forbidden scope:** Hover-only price, redesign card. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md; docs/CONTENT_FACTS.md (T008–T010).
- **Implementation notes:** На mobile цены/действия видны без hover.
- **Acceptance criteria:** Нет overflow; состояния и skeleton соответствуют данным.
- **Required checks:** lint/typecheck, viewport/console smoke.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T042): Catalog states и responsive

### T043 — Home с проверенными данными

- **ID:** T043
- **Priority:** P0
- **Status:** TODO
- **Title:** Home с проверенными данными
- **Goal:** Связать homepage с approved featured SKU, кадрами и текстом.
- **Why:** Демонстрационные цены/фото не годятся для release.
- **Dependencies:** T042.
- **Allowed scope:** Featured read, фактический контент T008–T010.
- **Forbidden scope:** Смена композиции или создание новых обещаний. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md; docs/CONTENT_FACTS.md (T008–T010).
- **Implementation notes:** При отсутствии подтверждённого контента показывать безопасное состояние.
- **Acceptance criteria:** Home не выдаёт placeholder за товар/проект; CTA ведёт в каталог.
- **Required checks:** content diff, desktop/mobile browser smoke.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T043): Home с проверенными данными


## PHASE 9 — Product Detail

### T044 — Product route и серверные данные

- **ID:** T044
- **Priority:** P0
- **Status:** TODO
- **Title:** Product route и серверные данные
- **Goal:** Реализовать /product/[slug] для опубликованного SKU.
- **Why:** Это точка принятия решения о заявке.
- **Dependencies:** T043.
- **Allowed scope:** Server query, title/series/price/unit/status/404.
- **Forbidden scope:** Корзина, schema changes. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md; docs/CONTENT_FACTS.md (T008–T010).
- **Implementation notes:** Архивные и скрытые category SKU не видны.
- **Acceptance criteria:** Товар читаем, цены корректны, hidden slug 404.
- **Required checks:** route/RLS smoke, lint/typecheck.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T044): Product route и серверные данные

### T045 — Gallery, specs и related

- **ID:** T045
- **Priority:** P0
- **Status:** TODO
- **Title:** Gallery, specs и related
- **Goal:** Показать точную фактуру, применение и подтверждённые свойства.
- **Why:** Атмосфера должна поддерживать технический выбор.
- **Dependencies:** T044.
- **Allowed scope:** Image gallery island, specs, related same series/category.
- **Forbidden scope:** Вымышленные характеристики и тяжёлый animation runtime. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md; docs/CONTENT_FACTS.md (T008–T010).
- **Implementation notes:** Фактуры реалистичны, lazy ниже fold, keyboard controls.
- **Acceptance criteria:** Gallery работает 1440/390, alt/данные верны.
- **Required checks:** typecheck, gallery/asset browser smoke.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T045): Gallery, specs и related

### T046 — Quantity UI и покупательский блок

- **ID:** T046
- **Priority:** P0
- **Status:** TODO
- **Title:** Quantity UI и покупательский блок
- **Goal:** Добавить выбор количества по шагу и ясное будущее действие.
- **Why:** Цена и единица должны быть понятны до Cart.
- **Dependencies:** T045.
- **Allowed scope:** Вычисление видимого итога, disabled если недоступно.
- **Forbidden scope:** Фиктивное добавление до cart state и online payment. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md; docs/CONTENT_FACTS.md (T008–T010).
- **Implementation notes:** Интеграция add-to-cart запланирована в T049 после cart model.
- **Acceptance criteria:** Шаг/минимум работают, действие до T049 честно недоступно.
- **Required checks:** targeted quantity tests, viewport smoke.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T046): Quantity UI и покупательский блок


## PHASE 10 — Cart

### T047 — Cart state model

- **ID:** T047
- **Priority:** P0
- **Status:** TODO
- **Title:** Cart state model
- **Goal:** Реализовать модель строк корзины и операции.
- **Why:** Неавторитетный client cart требует чётких правил.
- **Dependencies:** T046.
- **Allowed scope:** product_id, quantity, display snapshot, add/update/remove API.
- **Forbidden scope:** Backend cart и auth shoppers. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md.
- **Implementation notes:** Versioned shape, price никогда не источник заказа.
- **Acceptance criteria:** Операции идемпотентны в UI, некорректные количества отклонены.
- **Required checks:** unit tests на quantity/state, typecheck.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T047): Cart state model

### T048 — localStorage и hydration

- **ID:** T048
- **Priority:** P0
- **Status:** TODO
- **Title:** localStorage и hydration
- **Goal:** Сохранить корзину между посещениями без SSR mismatch.
- **Why:** Состояние browser недоступно Server Components.
- **Dependencies:** T047.
- **Allowed scope:** Version migration, safe parse, hydration loading.
- **Forbidden scope:** Cookie cart, DB таблица. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md.
- **Implementation notes:** При повреждении reset с понятным сообщением.
- **Acceptance criteria:** Reload сохраняет строки; broken storage не ломает страницу.
- **Required checks:** storage/hydration targeted tests.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T048): localStorage и hydration

### T049 — Add/remove/update интеграция

- **ID:** T049
- **Priority:** P0
- **Status:** TODO
- **Title:** Add/remove/update интеграция
- **Goal:** Подключить Product Detail и карточки к корзине.
- **Why:** Покупка должна работать, когда state готов.
- **Dependencies:** T048.
- **Allowed scope:** Кнопки добавить/удалить/изменить, count в header.
- **Forbidden scope:** Checkout API, analytics. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md.
- **Implementation notes:** Учитывать шаг, статус и disabled; без hover dependence.
- **Acceptance criteria:** Из товара можно добавить и удалить; count синхронен.
- **Required checks:** interaction smoke 1440/390, typecheck.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T049): Add/remove/update интеграция

### T050 — Cart page и price refresh

- **ID:** T050
- **Priority:** P0
- **Status:** TODO
- **Title:** Cart page и price refresh
- **Goal:** Реализовать /cart с проверкой текущего SKU/цены.
- **Why:** Перед отправкой покупатель видит актуальный итог.
- **Dependencies:** T049.
- **Allowed scope:** Items, quantity, empty/unavailable/changed price states.
- **Forbidden scope:** Создание order или backend cart. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md.
- **Implementation notes:** При расхождении явно подтверждать новую цену перед checkout.
- **Acceptance criteria:** Удалённый SKU отмечен, итог пересчитан по подтверждённым данным.
- **Required checks:** targeted refresh tests, browser smoke.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T050): Cart page и price refresh


## PHASE 11 — Checkout / Order Request

### T051 — Checkout form и consent

- **ID:** T051
- **Priority:** P0
- **Status:** TODO
- **Title:** Checkout form и consent
- **Goal:** Сделать /checkout с минимальными контактными полями.
- **Why:** Заявка должна быть простой и законной.
- **Dependencies:** T050.
- **Allowed scope:** Name/phone/consent, summary, client loading/errors.
- **Forbidden scope:** Оплата, лишние персональные поля, backend mutations. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; подтверждённые условия/consent T009.
- **Implementation notes:** При session/cart проблеме сохранить понятный путь назад.
- **Acceptance criteria:** Форма доступна, неверные поля отмечены, consent обязателен.
- **Required checks:** form validation, a11y and browser smoke.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T051): Checkout form и consent

### T052 — Order API validation boundary

- **ID:** T052
- **Priority:** P0
- **Status:** TODO
- **Title:** Order API validation boundary
- **Goal:** Создать POST /api/order-requests с серверной проверкой.
- **Why:** Browser price нельзя принимать на веру.
- **Dependencies:** T051.
- **Allowed scope:** Schema parsing, allowed origin/type/body, limits.
- **Forbidden scope:** DB insert, payment, admin API. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; подтверждённые условия/consent T009.
- **Implementation notes:** Проверить quantity, step, consent, phone и SKU.
- **Acceptance criteria:** Неверный payload не вызывает запись и возвращает безопасную ошибку.
- **Required checks:** targeted invalid payload/security tests.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T052): Order API validation boundary

### T053 — Fresh price и idempotency

- **ID:** T053
- **Priority:** P0
- **Status:** TODO
- **Title:** Fresh price и idempotency
- **Goal:** Добавить актуальную проверку и защиту повторной отправки.
- **Why:** Ретрай и изменение прайса не должны удваивать заявку.
- **Dependencies:** T052.
- **Allowed scope:** Uncached product read, canonical hash, unique key, 409.
- **Forbidden scope:** Изменение commercial snapshot после записи. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; подтверждённые условия/consent T009.
- **Implementation notes:** Существующий ключ сначала сопоставить с payload hash.
- **Acceptance criteria:** Changed price→409, identical retry→тот же номер, иной payload→conflict.
- **Required checks:** race/idempotency/price targeted tests.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T053): Fresh price и idempotency

### T054 — Private order insert и outcomes

- **ID:** T054
- **Priority:** P0
- **Status:** TODO
- **Title:** Private order insert и outcomes
- **Goal:** Записать одну order_requests row и вернуть безопасный результат.
- **Why:** Завершает путь заявки без частичных заказов.
- **Dependencies:** T053.
- **Allowed scope:** Server-only secret insert, success/error/retry UI.
- **Forbidden scope:** Public SELECT orders, order_items, payment. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; подтверждённые условия/consent T009.
- **Implementation notes:** Secret не в bundle; ответ без контактов/internal note.
- **Acceptance criteria:** Заявка появляется только один раз, успех/сбой понятны.
- **Required checks:** integration submit/RLS/bundle checks.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T054): Private order insert и outcomes

### T055 — Order flow integration gate

- **ID:** T055
- **Priority:** P0
- **Status:** TODO
- **Title:** Order flow integration gate
- **Goal:** Проверить Product→Cart→Checkout→Confirmation.
- **Why:** После нескольких TASK нужны проверки стыков.
- **Dependencies:** T054.
- **Allowed scope:** Сценарии нормальный, недоступный, changed price, retry.
- **Forbidden scope:** Полный e2e всего сайта и новые функции. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; подтверждённые условия/consent T009.
- **Implementation notes:** Проверять 1440/390 и console/network этого flow.
- **Acceptance criteria:** М6 принимает лишь подтверждённый, приватный и стабильный flow.
- **Required checks:** targeted browser integration + security checks.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T055): Order flow integration gate


## PHASE 12 — Admin Orders

### T056 — Admin orders list

- **ID:** T056
- **Priority:** P0
- **Status:** TODO
- **Title:** Admin orders list
- **Goal:** Реализовать /admin/orders со статусом и датой.
- **Why:** Менеджер должен видеть новые обращения сразу.
- **Dependencies:** T055.
- **Allowed scope:** Server-only guarded list, status filter/date sort.
- **Forbidden scope:** Public order API, BI dashboard. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md.
- **Implementation notes:** Выводить номер/дату/статус/контакт без cache.
- **Acceptance criteria:** Admin видит заявки; anon/non-admin не видит.
- **Required checks:** guarded list/RLS tests, lint/typecheck.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T056): Admin orders list

### T057 — Order detail snapshot

- **ID:** T057
- **Priority:** P0
- **Status:** TODO
- **Title:** Order detail snapshot
- **Goal:** Показать /admin/orders/[id] с неизменёнными строками.
- **Why:** Обработка требует точного состава и условий заявки.
- **Dependencies:** T056.
- **Allowed scope:** Позиции/qty/цена/unit/итог/имя/телефон/comment.
- **Forbidden scope:** Редактирование товаров, цены, контакта. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md.
- **Implementation notes:** Данные только из items_snapshot, не из текущего прайса.
- **Acceptance criteria:** Админ видит историю цены даже после изменения товара.
- **Required checks:** detail snapshot integration, no public leak.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T057): Order detail snapshot

### T058 — Status и internal note

- **ID:** T058
- **Priority:** P0
- **Status:** TODO
- **Title:** Status и internal note
- **Goal:** Добавить операционное изменение статуса и приватной заметки.
- **Why:** Заказ проходит new→in_progress→completed/cancelled.
- **Dependencies:** T057.
- **Allowed scope:** Guarded action, server validation, updated_at.
- **Forbidden scope:** Любые изменения коммерческих полей или публичный вывод заметки. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md.
- **Implementation notes:** Обрабатывать конфликт статуса/отсутствующий ID безопасно.
- **Acceptance criteria:** Сохранённый статус/заметка видны админу, snapshot не изменён.
- **Required checks:** column privilege, mutation/transition tests.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T058): Status и internal note

### T059 — Orders privacy gate

- **ID:** T059
- **Priority:** P0
- **Status:** TODO
- **Title:** Orders privacy gate
- **Goal:** Проверить прямой API и полный управленческий сценарий.
- **Why:** PII и commercial snapshot — критическая граница.
- **Dependencies:** T058.
- **Allowed scope:** Позитивные admin и негативные anon/non-admin тесты.
- **Forbidden scope:** Новые поля заказа, CRM, интеграции. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md.
- **Implementation notes:** Проверить internal_note во всех публичных ответах/логах.
- **Acceptance criteria:** M7: только admin видит и обновляет разрешённые поля.
- **Required checks:** targeted RLS/security + browser order smoke.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T059): Orders privacy gate


## PHASE 13 — Information Pages

### T060 — Applications и About

- **ID:** T060
- **Priority:** P1
- **Status:** TODO
- **Title:** Applications и About
- **Goal:** Создать страницы применения и компании на подтверждённом контенте.
- **Why:** Навигация должна объяснять материал и бренд.
- **Dependencies:** T059.
- **Allowed scope:** /applications, /about, реальные фото/подписи.
- **Forbidden scope:** Ложные кейсы/сертификаты, новый visual language. Не начинать соседнюю TASK.
- **Source of truth:** docs/CONTENT_AUDIT.md; T008–T010; docs/DESIGN_SYSTEM.md.
- **Implementation notes:** Контент из T008–T010; реализацию отличать от визуализации.
- **Acceptance criteria:** Страницы доступны/адаптивны, обещания проверены.
- **Required checks:** content fact check, lint/typecheck, browser smoke.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T060): Applications и About

### T061 — Delivery и Contacts

- **ID:** T061
- **Priority:** P0
- **Status:** TODO
- **Title:** Delivery и Contacts
- **Goal:** Опубликовать проверенные условия и способы связи.
- **Why:** Перед заявкой посетитель должен понимать получение товара.
- **Dependencies:** T060.
- **Allowed scope:** /delivery, /contacts, подтверждённые ссылки/адрес.
- **Forbidden scope:** Непроверенная бесплатная доставка и устаревшие контакты. Не начинать соседнюю TASK.
- **Source of truth:** docs/CONTENT_AUDIT.md; T008–T010; docs/DESIGN_SYSTEM.md.
- **Implementation notes:** Условия Сургута и возврата только после бизнес sign-off.
- **Acceptance criteria:** Телефон/адрес/условия совпадают с реестром T009.
- **Required checks:** link/contact check, responsive smoke.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T061): Delivery и Contacts

### T062 — Privacy и Terms

- **ID:** T062
- **Priority:** P0
- **Status:** TODO
- **Title:** Privacy и Terms
- **Goal:** Опубликовать согласованные правовые тексты.
- **Why:** Форма заявки с PII требует корректных ссылок.
- **Dependencies:** T061.
- **Allowed scope:** /privacy, /terms с утверждённой редакцией.
- **Forbidden scope:** Самостоятельное сочинение юридических обещаний. Не начинать соседнюю TASK.
- **Source of truth:** docs/CONTENT_AUDIT.md; T008–T010; docs/DESIGN_SYSTEM.md.
- **Implementation notes:** Если условия не утверждены — BLOCKED, не подставлять шаблон.
- **Acceptance criteria:** Checkout согласие ведёт на актуальную политику; обе страницы доступны.
- **Required checks:** legal sign-off, link/metadata checks.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T062): Privacy и Terms


## PHASE 14 — SEO

### T063 — Base metadata и canonical

- **ID:** T063
- **Priority:** P0
- **Status:** TODO
- **Title:** Base metadata и canonical
- **Goal:** Настроить titles/descriptions и canonical статичных страниц.
- **Why:** Поисковики должны получать точные адреса и сниппеты.
- **Dependencies:** T062.
- **Allowed scope:** Metadata API для публичных info routes и главной.
- **Forbidden scope:** Продвижение непроверенных характеристик. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/CONTENT_FACTS.md (T008–T010).
- **Implementation notes:** Один production SITE_URL, noindex cart/checkout/admin.
- **Acceptance criteria:** Canonical корректен, приватные routes исключены.
- **Required checks:** metadata HTML check, typecheck.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T063): Base metadata и canonical

### T064 — Dynamic SEO и indexing

- **ID:** T064
- **Priority:** P0
- **Status:** TODO
- **Title:** Dynamic SEO и indexing
- **Goal:** Добавить товарные/категорийные meta, OG, sitemap, robots.
- **Why:** Динамический каталог требует согласованной индексации.
- **Dependencies:** T063.
- **Allowed scope:** generateMetadata, canonical, Open Graph, опубликованные URL.
- **Forbidden scope:** Индексация черновиков/Preview и фильтров. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/CONTENT_FACTS.md (T008–T010).
- **Implementation notes:** Товарные цены/описания только verified; admin noindex.
- **Acceptance criteria:** Sitemap без скрытых SKU; Preview noindex.
- **Required checks:** sitemap/robots/OG targeted checks.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T064): Dynamic SEO и indexing

### T065 — Structured data

- **ID:** T065
- **Priority:** P1
- **Status:** TODO
- **Title:** Structured data
- **Goal:** Добавить Breadcrumb и Product/Offer JSON-LD по фактам.
- **Why:** Поисковые данные должны совпадать с витриной.
- **Dependencies:** T064.
- **Allowed scope:** Schema от published product и verified price/status.
- **Forbidden scope:** Ratings/reviews/availability без данных. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/CONTENT_FACTS.md (T008–T010).
- **Implementation notes:** Проверить единицу продажи и суммы из БД.
- **Acceptance criteria:** JSON-LD валиден, черновики не выводят Product.
- **Required checks:** structured data validator + typecheck.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T065): Structured data


## PHASE 15 — Yandex Metrika

### T066 — Metrika adapter и pageviews

- **ID:** T066
- **Priority:** P0
- **Status:** TODO
- **Title:** Metrika adapter и pageviews
- **Goal:** Подключить production-only adapter и корректный route tracking.
- **Why:** События SPA нельзя считать повторно.
- **Dependencies:** T065.
- **Allowed scope:** Script gating/consent, pageview handling.
- **Forbidden scope:** Метрика на Preview и cookie PII payload. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md.
- **Implementation notes:** Малый client island, конфиг из production env.
- **Acceptance criteria:** Один pageview на навигацию; Preview не отправляет.
- **Required checks:** network event smoke, typecheck.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T066): Metrika adapter и pageviews

### T067 — Catalog/product/cart goals

- **ID:** T067
- **Priority:** P0
- **Status:** TODO
- **Title:** Catalog/product/cart goals
- **Goal:** Добавить catalog_view/product_view/add_to_cart/remove_from_cart.
- **Why:** Воронка выбора должна измеряться без PII.
- **Dependencies:** T066.
- **Allowed scope:** События после фактического действия и корректного route.
- **Forbidden scope:** Двойной event при rerender, customer identifiers. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md.
- **Implementation notes:** Использовать централизованный adapter и стабильные цели.
- **Acceptance criteria:** Цели отправляются по одному разу, без поиска/контактов.
- **Required checks:** network event checks, no PII payload.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T067): Catalog/product/cart goals

### T068 — Checkout/contact goals

- **ID:** T068
- **Priority:** P0
- **Status:** TODO
- **Title:** Checkout/contact goals
- **Goal:** Добавить begin_checkout/order_submit/contact_click/phone_click.
- **Why:** Завершение заявки и контактные действия важны бизнесу.
- **Dependencies:** T067.
- **Allowed scope:** Событие success после server response, idempotency dedupe.
- **Forbidden scope:** Purchase event до подтверждения, телефон в params. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md.
- **Implementation notes:** Контроль согласия и условия production-only.
- **Acceptance criteria:** Retry не дублирует order_submit, значения без PII.
- **Required checks:** network privacy/idempotency checks.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T068): Checkout/contact goals


## PHASE 16 — Integrated QA

### T069 — Public integrated QA

- **ID:** T069
- **Priority:** P0
- **Status:** TODO
- **Title:** Public integrated QA
- **Goal:** Пройти каталог→товар→корзина→заявка с ошибками.
- **Why:** Разрозненные smoke не проверяют весь MVP.
- **Dependencies:** T068.
- **Allowed scope:** Desktop/mobile e2e, network, empty/conflict/retry.
- **Forbidden scope:** Редизайн и новые функции по ходу QA. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md; prototype/.
- **Implementation notes:** Фиксировать и исправлять лишь найденные дефекты отдельными commit в пределах TASK.
- **Acceptance criteria:** Полный публичный сценарий и console/network чистые.
- **Required checks:** full public e2e, typecheck, targeted fixes.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T069): Public integrated QA

### T070 — Admin integrated security QA

- **ID:** T070
- **Priority:** P0
- **Status:** TODO
- **Title:** Admin integrated security QA
- **Goal:** Пройти login→catalog/media→orders и прямые запреты.
- **Why:** Auth/RLS может ломаться на стыках.
- **Dependencies:** T069.
- **Allowed scope:** Admin E2E, anon/non-admin policies, session expiry, snapshot.
- **Forbidden scope:** Новые роли и обход проверок через secret. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md; prototype/.
- **Implementation notes:** Тестировать Storage upload/delete и revoked admin.
- **Acceptance criteria:** Admin flow работает, публичный доступ к PII/CRUD закрыт.
- **Required checks:** full admin e2e + RLS/CSRF matrix.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T070): Admin integrated security QA

### T071 — Visual, a11y и performance QA

- **ID:** T071
- **Priority:** P1
- **Status:** TODO
- **Title:** Visual, a11y и performance QA
- **Goal:** Проверить approved visual и рабочие устройства.
- **Why:** Heavy media и motion не должны мешать покупке.
- **Dependencies:** T070.
- **Allowed scope:** 1440/390/tablet, keyboard, reduced motion, LCP/CLS.
- **Forbidden scope:** Изменение DESIGN_SYSTEM без разрешения. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md; prototype/.
- **Implementation notes:** Compare prototype, исправить конкретные баги.
- **Acceptance criteria:** Нет горизонтального overflow, нарушений навигации и критичных regressions.
- **Required checks:** browser visual/a11y/performance milestone.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T071): Visual, a11y и performance QA


## PHASE 17 — Production Readiness

### T072 — Supabase production environment

- **ID:** T072
- **Priority:** P0
- **Status:** TODO
- **Title:** Supabase production environment
- **Goal:** Подготовить отдельные production БД/Auth/Storage и защищённые env.
- **Why:** Релиз не должен использовать Preview данные или учётные записи.
- **Dependencies:** T071.
- **Allowed scope:** Production Supabase project, проверенные migrations/RLS/Storage/Auth config, Vercel Production env.
- **Forbidden scope:** Production web deploy, реальные PII/секреты в Git. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md; docs/CONTENT_FACTS.md (T008–T010); результаты M1–M7.
- **Implementation notes:** Владелец вручную provision initial admin; сравнить grants/policies с Preview.
- **Acceptance criteria:** Production окружение изолировано, схема и auth/RLS проходят smoke.
- **Required checks:** migration/RLS/auth/env smoke, secret audit.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T072): Supabase production environment

### T073 — Production readiness evidence

- **ID:** T073
- **Priority:** P0
- **Status:** TODO
- **Title:** Production readiness evidence
- **Goal:** Сверить Preview, полный launch контент и условия запуска.
- **Why:** Production candidate требует доказанных gates, не только конфигурации.
- **Dependencies:** T072.
- **Allowed scope:** Preview QA evidence, полный согласованный ассортимент, SEO/analytics, бизнес sign-off.
- **Forbidden scope:** Запуск production, новые features, редизайн. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md; docs/CONTENT_FACTS.md (T008–T010); результаты M1–M7.
- **Implementation notes:** Владелец заполнил launch каталог через Admin; перечислить блокеры.
- **Acceptance criteria:** Все M1–M7 и обязательный контент подтверждены либо указан blocker.
- **Required checks:** readiness matrix, Preview smoke, content/security review.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T073): Production readiness evidence

### T074 — Final release candidate review

- **ID:** T074
- **Priority:** P0
- **Status:** TODO
- **Title:** Final release candidate review
- **Goal:** Независимо оценить готовность MVP к production.
- **Why:** Перед дорогим переходом нужен последний критический взгляд.
- **Dependencies:** T073.
- **Allowed scope:** Architecture/design/security/content/QA evidence и blocker decision.
- **Forbidden scope:** Deploy, merge main, новое приложение. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md; docs/CONTENT_FACTS.md (T008–T010); результаты M1–M7.
- **Implementation notes:** Astra только здесь; зафиксировать go/no-go и остаточные риски.
- **Acceptance criteria:** M8: подтверждён production candidate либо точный блокер; production не запущен.
- **Required checks:** final security/performance/functional review.
- **Recommended model:** GPT-6 Astra
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T074): Final release candidate review

## Self-review перед commit

- Проверить, что каждая TASK ограничена одной целью, зависимости ссылаются на существующий ID и gate не пропущен.
- Подтвердить: Admin Auth до admin mutations; schema/RLS до Admin и публичного каталога; каталог и Admin используют одну модель SKU; order status не меняет исходный snapshot.
- Убедиться, что P1 остаётся частью MVP, High назначен только security/data/state задачам, Astra — последнему review; дополнительных агентов нет.
- M8 наступает после QA, production deployment не входит в этот план без отдельного разрешения.

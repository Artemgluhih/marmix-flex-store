# Marmix Flex Redesign v2 — Implementation TASK Plan

**Статус:** план утверждён; T001–T050 — DONE, T051–T074 — TODO; M1 — PASS; M2 — PASS; M3 — PASS; M4 — PASS; Development Gate — PASS for isolated Preview work; Production Content Gate — BLOCKED: two commercial and three legal groups remain. Media rights/mapping blockers are 0; selected-media visual quality review remains a pre-production requirement. Технический source of truth — [ARCHITECTURE.md](ARCHITECTURE.md), визуальный — [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). [CONTENT_AUDIT.md](CONTENT_AUDIT.md) фиксирует непроверенные бизнес-данные, [DESIGN_DIRECTIONS.md](DESIGN_DIRECTIONS.md) — историю утверждения, [prototype](../prototype/index.html) — approved visual reference. Этот документ не создаёт приложение, SQL, интеграции или production deployment.

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
| Development Gate — **PASS** | T010 | T008–T010 DONE. T011 and subsequent technical tasks may proceed in isolated Preview under the TEST_ONLY/nullable commercial rules below. |
| Production Content Gate — **BLOCKED** | T010; required before Phase 17 readiness | Two real commercial groups and three real legal groups remain unresolved. Production commerce, readiness and deployment are forbidden until this gate passes; selected-media quality review remains a separate pre-production check. |
| M3 — Supabase & Admin Auth secured — **PASS** | T022 | T011–T022: схемы, anon/RLS/Storage, закрытый signup, active membership, session/guard, негативные security проверки. |
| M4 — Admin catalog management operational — **PASS** | T038 | T023–T032, T032A, T033–T038: dashboard, multi-category membership/legacy migration, Products/Categories CRUD в рамках разрешений, media upload/primary/delete и проверочный набор подтверждённых SKU через Admin; проверить интеграцию с M3. |
| M5 — Public catalog operational | T046 | T039–T046: списки/поиск/категории/Product Detail на общих данных, только published, реальные цена/медиа. Подключение add-to-cart является T049 и входит в M6. |
| M6 — Cart & Order flow operational | T055 | T047–T055: persistence, refresh цен, server validation, idempotency, одна приватная заявка и подтверждение; проверить вместе с M5. |
| M7 — Admin order management operational | T059 | T056–T059: статус/заметка в Admin; original snapshot не изменяем через UI и прямой authenticated API; интеграция с M6. |
| M8 — Production candidate | T074 | T060–T074: информационные страницы, SEO, Метрика, интеграционный QA и readiness; все M1–M7 пройдены, production не запущен. |

**M1 status: PASS.** T001–T003 DONE; lint/typecheck/build PASS, branch HTTPS Preview READY, Prata/Manrope/tokens PASS, owner visual smoke 1440 × 900 и 390 × 844 PASS; ошибочный deployment нового проекта удалён, существующий production не изменён.

**Development Gate: PASS. Production Content Gate: BLOCKED.** T008, T009 и T010 остаются DONE; media blockers = 0. Development Gate разрешает T011+ как техническую Preview работу. Production Content Gate сохраняет пять сгруппированных blockers: **COMMERCIAL (2)** — площадь продаваемого формата для 14 SKU «Гибкая доска»; точные цены/правила вариантов для 20 range-price SKU. **LEGAL (3)** — seller/operator identity и Privacy/consent legal sign-off; returns/claims text и claims contact/legal review; подробные delivery/pickup условия. Это шесть отдельных типов недостающих реальных данных, сгруппированных в пять областей. Не считать их закрытыми от появления тестовых значений. Owner visual review выбранных уникальных медиа обязателен перед production отдельно от этого gate.

**Обязательное правило для всех следующих Preview TASK:** неизвестные реальные owner fields остаются `null`/unresolved; 251 реальный SKU не получает придуманных prices, dimensions, availability или legal facts. Опубликованный реальный SKU может отображаться в Catalog/Product Detail с медиа при неполных commercial data, но add-to-cart/order запрещены. `commercial_ready` (или эквивалент) вычисляется на сервере: нужны публикация, полный commercial набор, точная применимая цена, корректная конверсия количества и `in_stock` либо `on_order`. Отсутствие любого условия → non-orderable. UI disabled не заменяет серверную проверку при заявке.

**TEST_ONLY fixtures:** только отдельный Preview/test набор для targeted schema/cart/order checks, с явной маркировкой `TEST_ONLY`; синтетические price/dimensions/availability/conversion не присваивать реальным SKU. Fixtures не входят в production catalog или production seed. Production seeding реального каталога — только из owner-confirmed fields. Preview legal state — нейтральное `Pending owner/legal approval` либо отсутствие production legal content; никакие фиктивные seller requisites, return policy или consent не допускаются. В Preview flow использовать только синтетические контакты, не реальные заявки.

M1–M7 оценивают Preview реализацию с этими ограничениями. Перед production readiness/deployment обязателен **PASS Production Content Gate**, согласованные legal тексты и owner visual sign-off; текущий gate запрещает запуск. M8 — оценка кандидата после QA, не деплой. T032 исторически DONE; T032A завершает multi-category переход в Phase 6. M4 — PASS после завершения T038: Admin shell/dashboard, Product/Category CRUD, multi-category, media flows и три проверочных REAL SKU интегрированы в Preview. T034 owner browser batch upload PASS и synthetic cleanup = 0; T035 visual PASS; T036 browser delete/orphan retry/cleanup PASS; T037 representative image presentation PASS. T038 сохранённые REAL SKU — только representative subset, не полный launch population. Следующая задача T039, не начата.

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
- **Implementation notes:** Демо кадры сохранять презентационными; не выдавать за подтверждённые SKU photos при Preview или production.
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
- **Verification note:** Acceptance criteria выполнены: владелец подтвердил 251 INCLUDE, 251 стабильный SKU, 8 категорий, 231 фиксированную цену, 226 панельных размеров 142 × 284 см / 4.0328 м², правила цены/количества для поверхностей, две разные «Калаката», срок службы 30 лет и availability policy. После owner decisions C1–C4 остаются две реальные commercial группы; accessory unit/minimum/step и public slug collisions разрешены. T009/T010 DONE, Development Gate PASS; Production Content Gate BLOCKED. T011 остаётся TODO.
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
- **Status:** DONE
- **Title:** Supabase Preview environment
- **Goal:** Подготовить изолированный тестовый проект и безопасные env.
- **Why:** Schema и Auth требуют защищённого окружения.
- **Dependencies:** T010; Development Gate PASS. Production Content Gate не требуется для Preview environment.
- **Allowed scope:** Только Preview project, переменные в защищённом хранилище.
- **Forbidden scope:** Production project, реальные секреты в Git, seed. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; owner-confirmed facts docs/CONTENT_FACTS.md (T008–T010); Development Gate policy above.
- **Implementation notes:** Изолировать Preview от production; публичный URL и publishable key не secret. Ни seed, ни synthetic fixtures в T011 не создаются.
- **Acceptance criteria:** Preview env доступен серверу, production изолирован.
- **Required checks:** env exposure check, connection smoke без PII.
- **Resolution (2026-09-27):** отдельный проект `marmix-flex-redesign-v2-preview` (`twuevnwxwqdjbjzwuglm`, `eu-central-1`) в состоянии ACTIVE_HEALTHY. Owner настроил в существующем Vercel Preview project только `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` и выполнил Preview redeploy. На временном server-only route в READY Preview deployment (ID намеренно не сохранён в документации) (ветка `redesign-v2`, commit `d8e8e76d054cd0b59181792f56422a6490b6eb41`) наблюдались `previewEnvironment=true`, `envPresent=true`, `supabaseReachable=true`: проверка HTTPS `/auth/v1/health` с publishable key и строгим соответствием URL отдельному Preview project. Ответ содержал только три boolean; в проверенных runtime logs нет значений env/ключей. Public tables/migrations: 0; seed/fixtures не создавались; legacy Supabase не изменён, Vercel Production не менялся по подтверждению owner. Временный route удалён из финального checkout отдельным cleanup commit; никаких секретов в Git. Development Gate PASS, Production Content Gate BLOCKED.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T011): Supabase Preview environment

### T012 — Schema каталога и индексы

- **ID:** T012
- **Priority:** P0
- **Status:** DONE
- **Title:** Schema каталога и индексы
- **Goal:** Создать categories/products/product_images под утверждённую модель SKU.
- **Why:** Admin и витрина должны разделять одну модель.
- **Dependencies:** T011.
- **Allowed scope:** Миграция таблиц, checks/uniques/FK/indexes.
- **Forbidden scope:** Order schema, seed, UI, Auth. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; owner-confirmed facts docs/CONTENT_FACTS.md (T008–T010); Development Gate policy above.
- **Implementation notes:** Реальные неполные commercial fields должны допускать null/unresolved и visible non-orderable SKU; уникальные slug/SKU и primary. Способ TEST_ONLY изоляции и constraints определить здесь, без присвоения synthetic значений реальным SKU.
- **Acceptance criteria:** Миграция воспроизводима; ограничения отклоняют некорректные известные значения и допускают подтверждённые реальные SKU с пустыми обязательными для commerce полями.
- **Required checks:** migration check, targeted DB constraints.
- **Resolution (2026-09-27):** миграция `supabase/migrations/20260927104945_catalog_foundation.sql` применена только к Supabase Preview `twuevnwxwqdjbjzwuglm`, её filename version совпадает с записью migration history. Созданы пустые `categories`, `products`, `product_images`: UUID PK, уникальные category/product slug и SKU, FK с RESTRICT, допустимые роли изображений через CHECK и partial unique index на primary. `price_minor` хранит только точную цену в копейках RUB; диапазон отдельно в `source_price_range`; `price_unit` и `sale_unit` разделены; площадь листа `numeric(14,4)` и неизвестные коммерческие/размерные поля nullable; availability nullable только `in_stock`/`on_order`. Один product = один immutable SKU. `catalog_kind` REAL/TEST_ONLY, префикс TEST_ONLY SKU и immutable trigger отделяют будущие fixtures; изображения наследуют тип через product FK. Public policies T014 обязаны допускать только REAL и опубликованные product/category; пока все три таблицы имеют RLS enabled без policies, API grants отозваны. Targeted DB checks (включая duplicate SKU/slug, неверные price/quantity/availability/dimensions, второе primary, TEST_ONLY marker) PASS в транзакции с rollback; по завершении все три таблицы пусты. Seed, Auth, Storage, order schema, production изменения отсутствуют. Development Gate PASS; Production Content Gate BLOCKED.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T012): Schema каталога и индексы

### T013 — Schema заявки и неизменяемость

- **ID:** T013
- **Priority:** P0
- **Status:** DONE
- **Title:** Schema заявки и неизменяемость
- **Goal:** Создать order_requests со snapshot, статусами и разрешёнными update columns.
- **Why:** Заявка должна сохранять исходную цену навсегда.
- **Dependencies:** T012.
- **Allowed scope:** Таблица, idempotency uniqueness, updated_at, grants.
- **Forbidden scope:** Checkout API, admin UI, order_items без нужды. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; owner-confirmed facts docs/CONTENT_FACTS.md (T008–T010); Development Gate policy above.
- **Implementation notes:** Column UPDATE только status/internal_note; коммерческие поля immutable.
- **Acceptance criteria:** DB отвергает изменение суммы/строк authenticated ролью.
- **Required checks:** migration check, negative column privilege tests.
- **Resolution (2026-09-27):** Preview-only migration `supabase/migrations/20260927172948_order_requests_foundation.sql` применена после T012; версия файла совпадает с migration history. Одна пустая `order_requests` с UUID PK, client-generated UUID `idempotency_key UNIQUE` без DB default, обязательным opaque `request_hash bytea` (32–64 байта), `name/phone` NOT NULL, nullable `city/email/comment/internal_note`, явным `consent_at`, непустым JSONB array `items_snapshot`, `total_minor bigint >= 0`, RUB, статусами `new/in_progress/completed/cancelled` и индексом очереди `(status, created_at DESC, id)`. Триггер БД меняет `updated_at` и запрещает любые изменения кроме `status/internal_note`, включая customer/commercial snapshot и idempotency. Anon CRUD отсутствует; authenticated получает только column-level UPDATE(status,internal_note), без table-level UPDATE/DELETE/INSERT и без SELECT до RLS/grants T014; service_role только SELECT/INSERT для будущего server-only API. RLS enabled без policies до T014. Constraint, privilege, trigger и negative role tests PASS; synthetic строки были только в transaction с rollback, в заявках 0 строк. Legacy/production Supabase не изменён; Development Gate PASS, Production Content Gate BLOCKED.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T013): Schema заявки и неизменяемость

### T014 — RLS публикации и приватности

- **ID:** T014
- **Priority:** P0
- **Status:** DONE
- **Title:** RLS публикации и приватности
- **Goal:** Добавить публичные read policies и закрыть заявки.
- **Why:** Прямая Data API не должна обходить сайт.
- **Dependencies:** T013.
- **Allowed scope:** RLS/grants для каталога и заказов.
- **Forbidden scope:** Admin policies до membership, seed, frontend. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; owner-confirmed facts docs/CONTENT_FACTS.md (T008–T010); Development Gate policy above.
- **Implementation notes:** Проверить связи продукт↔категория↔изображение; публичные policies/grants исключают `products.catalog_kind = 'TEST_ONLY'` через явное `catalog_kind = 'REAL'` и проверяют опубликованную категорию. T012 оставила API доступ закрытым до этой задачи.
- **Acceptance criteria:** anon видит только опубликованное и не читает/меняет orders.
- **Required checks:** targeted anon/authenticated denial tests.
- **Resolution (2026-09-28):** Preview migration `supabase/migrations/20260928040650_public_catalog_rls_privacy.sql` применена, filename version совпадает с migration history. RLS включена на всех четырёх таблицах; `anon` и ordinary `authenticated` имеют только SELECT для `categories/products/product_images`. Public policies показывают только опубликованную категорию, опубликованный неархивный REAL товар в опубликованной категории и его изображения; опубликованный TEST_ONLY скрыт. Для `order_requests` нет policies: anon CRUD закрыт, authenticated без SELECT/INSERT/DELETE/table-level UPDATE, а T013 column-level UPDATE(status,internal_note) остаётся без RLS-доступа до T017. Role simulation проверила SQL grants и RLS вместе: public read PASS, закрытый каталог/orders и mutations DENIED, authenticated status UPDATE затронул 0 строк. Synthetic строки в транзакции с ROLLBACK, после теста 0 строк во всех четырёх таблицах; legacy/production Supabase не изменён. Security advisor показывает только ожидаемый INFO `rls_enabled_no_policy` для приватной таблицы заявок. Development Gate PASS; Production Content Gate BLOCKED.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T014): RLS публикации и приватности

### T015 — Storage bucket baseline

- **ID:** T015
- **Priority:** P0
- **Status:** DONE
- **Title:** Storage bucket baseline
- **Goal:** Создать product media bucket и начальные ограничения.
- **Why:** Image delivery зависит от безопасного хранения.
- **Dependencies:** T014.
- **Allowed scope:** Bucket MIME/size, публичный read, запрет публичных mutations.
- **Forbidden scope:** Admin upload UI и admin Storage write policies. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; owner-confirmed facts docs/CONTENT_FACTS.md (T008–T010); Development Gate policy above.
- **Implementation notes:** Не загружать неподтверждённые кадры; ключи и префиксы фиксированы.
- **Acceptance criteria:** anon может читать разрешённый asset, не может upload/delete.
- **Required checks:** Storage policy negative tests.
- **Resolution (2026-09-28):** В отдельном Supabase Preview применена migration `supabase/migrations/20260928044406_product_media_bucket_baseline.sql` с совпадающей migration history: один `product-media` bucket, public object URL, MIME только `image/jpeg`, `image/png`, `image/webp`, `image/avif`, максимальный размер 12 MiB (12 582 912 байт). Это технический лимит bucket, не коммерческий факт. Будущие Admin пути генерируются под `products/<product-id>/<generated-file-key>.<ext>`; raw user path не допускается. Известный URL публичного bucket доступен всем: в него можно загружать только owner-approved media с правами на публичный показ, не confidential drafts. Storage `objects` RLS включена и policies отсутствуют: anon/authenticated upload, overwrite и delete не получают доступа до admin membership/policies будущих TASK. Технический TEST_ONLY PNG через доверенную Preview панель дал HTTP 200 public URL и совпадение байтов; SVG отклонён MIME restriction; лимит файла подтверждён конфигурацией bucket. SQL role smoke подтвердил denied mutations для anon и ordinary authenticated; PNG удалён, объектов 0, реальные изображения и product_images rows не добавлялись. Legacy/production Storage не менялся; Development Gate PASS, Production Content Gate BLOCKED.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T015): Storage bucket baseline

### T016 — Server clients и env boundary

- **ID:** T016
- **Priority:** P0
- **Status:** DONE
- **Title:** Server clients и env boundary
- **Goal:** Реализовать отдельные public и secret Supabase clients.
- **Why:** Secret нужен только публичному endpoint заявки.
- **Dependencies:** T015.
- **Allowed scope:** server-only clients, конфиг, типы ошибок, проверка env.
- **Forbidden scope:** Order endpoint, auth, браузерный secret. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; owner-confirmed facts docs/CONTENT_FACTS.md (T008–T010); Development Gate policy above.
- **Implementation notes:** Public read всегда без admin cookies; secret client не экспортировать в client.
- **Acceptance criteria:** Build не включает secret; anon/secret boundaries проверены.
- **Required checks:** typecheck, bundle boundary, targeted DB smoke.
- **Resolution (2026-09-29):** Public client использует только Preview URL и publishable key, без cookies и user session; catalog SELECT PASS, доступ к `order_requests` DENIED. Отдельный `server-only` Secret client создан только для будущего server-side Order API, без browser import; env проверяются при использовании и нормализуются через `trim()`. Secret server smoke на `order_requests SELECT id LIMIT 1` — PASS (HTTP 200, owner/authorized Vercel verification на deployed Preview); пустой результат допустим, записи не создавались. Secret catalog SELECT закрыт grants по проекту и не является тестом Secret client. Временный Preview diagnostic route удалён; lint, typecheck, build, bundle/Git secret scans PASS. Production без изменений. Development Gate PASS, Production Content Gate BLOCKED; следующая TASK T017.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T016): Server clients и env boundary


## PHASE 4 — Admin Authentication

### T017 — admin_users и admin RLS

- **ID:** T017
- **Priority:** P0
- **Status:** DONE
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
- **Resolution (2026-09-29):** Preview migration `supabase/migrations/20260929052535_admin_users_and_admin_rls.sql` applied with matching history. `admin_users` uses Auth UUID PK/FK (`ON DELETE CASCADE`), active flag and own-row SELECT under RLS; anon has no access, authenticated has no membership writes. Existing public T014 SELECT remains intact. Only active membership grants private catalog SELECT and scoped category/product INSERT/UPDATE, image-row INSERT/UPDATE/DELETE, order SELECT and T013 column-only status/internal_note UPDATE. Catalog/category physical DELETE, order INSERT/DELETE and immutable snapshot UPDATE remain denied; Storage policies unchanged. Targeted active/non-admin/inactive and anon RLS tests passed with synthetic Auth/catalog/order rows rolled back; permanent test accounts/rows 0. Public Data API catalog SELECT PASS, order and membership access denied; security advisor had no findings. Development Gate PASS, Production Content Gate BLOCKED; next T018.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T017): admin_users и admin RLS

### T018 — Auth config и первый admin

- **ID:** T018
- **Priority:** P0
- **Status:** DONE
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
- **Resolution (2026-09-29):** Supabase Preview public settings подтверждают `disable_signup=true`, email/password provider включён, phone/external providers выключены. Публичный `signUp` с уникальным синтетическим адресом отклонён `signup_disabled`; anonymous sign-in отклонён `anonymous_provider_disabled`, тестовые аккаунты не созданы. Владелец вручную provisioned единственный подтверждённый Preview email/password Auth user через Dashboard; trusted management SQL добавил ровно одну active membership с тем же UUID. Отдельные Auth account и membership проверены без вывода email, password, hash или token; полноценный password login/session — T020. T017 own-row SELECT и active-membership policies сохранены, self-write grants отсутствуют; non-admin не получает admin rights. Production Auth не менялся, Development Gate PASS, Production Content Gate BLOCKED. Supabase security advisor показывает WARN о выключенной leaked-password protection; настройка не менялась в T018 и требует отдельного Auth security review перед production. Следующая TASK T019.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T018): Auth config и первый admin

### T019 — SSR session refresh

- **ID:** T019
- **Priority:** P0
- **Status:** DONE
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
- **Resolution (2026-09-29):** Installed pinned `@supabase/ssr` and added a request-scoped, server-only cookie Auth client using only the Preview URL and publishable key. Next 16 `src/proxy.ts` runs only on `/admin` and descendants, calls `getUser()` for session verification/refresh, forwards updated request cookies and returns all response Set-Cookie values with cookie attributes and private/no-store cache headers. It is session maintenance, not an admin authorization guard; membership checks remain T021. Targeted matcher, cookie propagation (including consecutive writes), server Auth adapter, no-session and malformed-cookie tests passed without real credentials or token output. Local HTTP requests without a session and with synthetic malformed cookie returned safely with no Set-Cookie and no private data. Public catalog and Order-only Secret clients remain separate and unchanged; no login UI or admin data access was added. Real password-login/browser session integration is required in T020 when its flow exists. Development Gate PASS; Production Content Gate BLOCKED; Production unchanged. The existing Preview leaked-password protection warning remains for pre-production security review. Next T020.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T019): SSR session refresh

### T020 — Admin login и logout

- **ID:** T020
- **Priority:** P0
- **Status:** DONE
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
- **Resolution (2026-09-29):** Preview `/admin/login` uses server-side Supabase password Auth, verifies the user with `getUser()` and checks active `admin_users` membership through the authenticated JWT/RLS before redirecting to a safe local path. Invalid credentials and non-admin membership yield the same generic error; non-admin sessions are cleared. Owner confirmed real admin login and a browser Auth session. Owner then confirmed real Preview logout through the existing POST `logoutAction`: the browser returned to `/admin/login`, and a subsequent visit remained on the login form instead of accepting the signed-out session. The temporary Preview-only `TEST_ONLY` logout route used for this smoke was removed. Targeted negative auth, redirect, cookie-propagation, no-session and cross-origin checks passed; lint, typecheck, build and secret-path review passed. No credentials, cookies, tokens or session values were recorded. This login/logout flow does not add the T021 admin guard or Admin shell. Development Gate PASS; Production Content Gate BLOCKED; Production unchanged. Next T021.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T020): Admin login и logout

### T021 — requireAdmin и guard mutations

- **ID:** T021
- **Priority:** P0
- **Status:** DONE
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
- **Resolution (2026-09-29):** Added server-only `requireAdmin()` and independent `requireAdminMutation()` for future Admin actions/handlers. Every invocation uses the request-scoped cookie Auth client, `getUser()` and an uncached own-row `admin_users` read under the user JWT/T017 RLS; only active membership returns a minimal user ID and authenticated client. The `(workspace)` layout invokes the page guard before children, is dynamic/no-store/noindex, and leaves `/admin/login` outside the group. No session or inactive/non-admin membership redirects to the login route; the existing login flow clears a valid non-admin session. Mutation guard checks strict request Origin against host/forwarded protocol before checking Auth and denies by safe redirect; non-admin mutation denial attempts local signOut. Direct-invocation harness covered active, no-session, invalid/expired, non-admin and revoked membership, same/cross-origin, safe return path and T020 login/logout. No Auth fixture or DB row was created. Preview anon catalog SELECT PASS, anon orders denied; Storage has zero write policies/objects; one real Auth user and matching membership remain, synthetic accounts 0. Lint/typecheck/build and bundle/Git secret scans PASS. T019 proxy and T020 behavior retained; no Admin shell, Storage policy or Production change. Development Gate PASS; Production Content Gate BLOCKED. Next T022.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T021): requireAdmin и guard mutations

### T022 — Admin Auth security gate

- **ID:** T022
- **Priority:** P0
- **Status:** DONE
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
- **Resolution (2026-09-29):** Preview security integration and remote smoke PASS: public signup and anonymous sign-in denied; session/login/logout and server mutation guard regressions PASS; cross-origin mutation denied; private catalog and order access require active membership; immutable order snapshot and Storage mutation baseline preserved. Owner-authorized direct PostgREST JWT verification: active admin sees own active membership and can SELECT orders; separate authenticated non-admin sees empty membership and order results, and self-escalation INSERT is denied (HTTP 403). Anon order access and catalog mutation denied. Temporary non-admin Auth user removed; final Preview counts: one real Auth user with one matching active membership, zero unlinked/synthetic accounts, zero catalog/order test rows and zero Storage objects. Security Advisor has zero blocking findings. Its leaked-password protection WARN remains a separate pre-production Auth item; M3 PASS does not change Production Content Gate BLOCKED. Production unchanged. Next T023.


## PHASE 5 — Admin Shell

### T023 — Admin shell и навигация

- **ID:** T023
- **Priority:** P0
- **Status:** DONE
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
- **Resolution (2026-09-30):** Protected `/admin` shell, desktop sidebar, tablet/mobile drawer, route state, existing server logout action, local public-site link and neutral landing page implemented in Preview. T021 server guard, dynamic/no-store/noindex and separate login retained. Lint, typecheck, build and Git secret-path checks PASS. READY HTTPS Preview for the `redesign-v2` implementation commit; unauthenticated `/admin` redirects to login, login and public home return successfully, admin response is private/no-store and noindex. Owner completed authenticated visual verification after real login: desktop/mobile navigation, keyboard/focus, visible logout and public-site link PASS; 390/768/1024/1440/1920/2560 PASS; horizontal overflow and visual breakage absent. Credentials were not shared. T023 DONE. T024 remains TODO; gates and M3 unchanged.

### T024 — Operational dashboard

- **ID:** T024
- **Priority:** P0
- **Status:** DONE
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
- **Resolution (2026-09-30):** READY HTTPS Preview dashboard reads five exact `head` counts after a fresh `requireAdmin()` under authenticated user JWT/T017 RLS: new and in-progress orders, published and hidden unarchived REAL products, and archived REAL products. No PII, Secret client, hardcoded metrics or production data. Empty Preview returns honest zero; query errors throw a generic server error. Transactional authenticated role smoke with a visible TEST_ONLY product confirmed it is excluded; rollback left zero catalog/order rows. Direct Preview counts are all zero. Missing `/admin/orders` and `/admin/products` routes remain non-clickable future destinations according to T023 navigation, without 404 links or list implementation. Lint/typecheck/build and secret scan PASS; unauthenticated `/admin` redirects to login, login/public home smoke PASS, private/no-store/noindex retained. Owner verified after real admin login: counters readable, orders/catalog separation understandable, zero state and no PII PASS; desktop and mobile 390 PASS, no horizontal overflow, visual consistency with T023 PASS. Credentials were not shared. T024 DONE. T025 remains TODO; gates and M3 unchanged.

### T025 — Admin states и responsive

- **ID:** T025
- **Priority:** P1
- **Status:** DONE
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
- **Resolution (2026-09-30):** READY Preview adds restrained route loading, safe error/retry and honest fully empty group notes. T024 exact count queries, REAL/TEST_ONLY semantics and Admin RLS remain unchanged. Controlled local harness verified loading, retry, zeros and generic failure instead of a false zero; lint/typecheck/build PASS. Guest `/admin` redirects to login, public homepage smoke PASS. Owner verified after real admin login: 390/768/1024/1440 and 1920/2560 sanity, keyboard/focus, mobile drawer, zero state and T023/T024 visual consistency PASS; horizontal overflow NO. Production unchanged. T025 DONE; M3 and Development Gate PASS; Production Content Gate BLOCKED. Next T026, not started.


## PHASE 6 — Admin Catalog Management

### T026 — Products list

- **ID:** T026
- **Priority:** P0
- **Status:** DONE
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
- **Resolution (2026-09-30):** READY Preview `/admin/products` reads only REAL rows after `requireAdmin()` through the authenticated JWT/T017 RLS client, with one category relation select, stable order and no Secret client. The list presents SKU, name, category, exact RUB price or neutral null state, and published/hidden/archived status; desktop table and compact mobile presentation share T023–T025 shell and states. Empty Preview products/categories remain 0. Targeted TEST_ONLY published/hidden/archived, null-price and category checks ran in a rollback transaction; permanent synthetic rows 0. Local rendering/query/error harness, lint/typecheck/build, guest redirect and public smoke PASS. Owner after real login verified desktop/mobile list, all field/status labels, null and empty states, active navigation, 390/768/1024/1440, no horizontal overflow and T023–T025 visual consistency. T026 DONE; M3 and Development Gate PASS; Production Content Gate BLOCKED. Next T027, not started.

### T027 — Products search и filters

- **ID:** T027
- **Priority:** P0
- **Status:** DONE
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
- **Resolution (2026-09-30):** READY Preview `/admin/products` uses server-side, whitelisted GET search by SKU/name, publication/category filters, stable sorting and exact-count pagination for REAL products under authenticated admin RLS. Invalid and out-of-range parameters normalize safely; TEST_ONLY is excluded, and the empty catalog is distinguished from no search matches. Targeted query/URL/count checks, lint/typecheck/build, guest redirect and public smoke PASS; temporary test rows rolled back. Owner after real admin login verified search, status/category/sort/reset controls, pagination and no-result state, 390/768/1024/1440, no horizontal overflow and T026/Admin shell consistency. Production unchanged; M3 and Development Gate PASS; Production Content Gate BLOCKED. Next T028, not started.

### T028 — Create product

- **ID:** T028
- **Priority:** P0
- **Status:** DONE
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
- **Resolution (2026-09-30):** READY Preview `/admin/products/new` is guarded by `requireAdmin()` and an independent same-origin `requireAdminMutation()` action using the authenticated JWT under T017 RLS. It validates name, stable SKU, slug, existing category, optional series, exact RUB-to-kopeck price, constrained price/sale units and positive integer minimum/step. The action inserts only REAL, unpublished, unarchived drafts; unknown commerce stays NULL. Unique SKU/slug conflicts return safe field errors, and the list is revalidated after save. Targeted validation and transactional TEST_ONLY active-admin insert/read, anon invisibility and non-admin/anon denial checks PASS with rollback; permanent synthetic rows 0. Lint/typecheck/build and guarded Preview route/public smoke PASS. Owner after real login verified form, empty-category state, labels/validation, 390/768/1024/1440, no overflow and Admin visual consistency. Preview has no categories yet; the form disables save until one exists, without blocking T028. Production unchanged; M3 and Development Gate PASS, Production Content Gate BLOCKED. Next T029, not started.

### T029 — Edit product properties

- **ID:** T029
- **Priority:** P0
- **Status:** DONE
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
- **Resolution (2026-09-30):** защищённый `/admin/products/[id]` редактирует только описание, nullable размеры/площадь, контролируемые характеристики/атрибуты и SEO одной строки через authenticated admin JWT и T017 RLS. Независимый same-origin mutation guard, строгая проверка полей и явный allowlist исключают mass assignment: SKU/slug, цена, публикация и архив не меняются. Транзакционные Preview TEST_ONLY тесты с ROLLBACK подтвердили сохранение/повторное чтение свойств, валидацию, отказ anon/non-admin и неизменность публикации/архива; постоянных synthetic products/categories/rows — 0. Lint/typecheck/build и guarded Preview/public smoke PASS. Owner после реального admin login подтвердил layout, группировку, размеры, характеристики/атрибуты, SEO, ошибки, 390/768/1024/1440, отсутствие overflow и согласованность с Admin shell. Временный Preview-only visual-check route удалён после проверки; реальный editor сохранён. Production unchanged; Development Gate PASS; Production Content Gate BLOCKED. Next T030, not started.

### T030 — Publication и assortment states

- **ID:** T030
- **Priority:** P0
- **Status:** DONE
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
- **Resolution (2026-09-30):** Product Editor получил отдельную секцию публикации и ассортимента: явные publish/unpublish, archive с подтверждением и restore без автопубликации, nullable availability, `is_featured` и nonnegative integer sort_order. Server Actions вызывают same-origin `requireAdminMutation()` и работают под authenticated admin JWT/T017 RLS с явной allowlist. Архивирование атомарно снимает публикацию; попытка опубликовать архивный SKU отвергается. Физического DELETE нет. Транзакционные Preview TEST_ONLY проверки переходов, RLS и отрицательных сценариев завершились ROLLBACK; постоянных synthetic products/categories/rows — 0. По согласованной owner замене позитивный REAL public path подтверждён действующей T014 policy и ранее выполненными RLS checks; опубликованный TEST_ONLY невидим anon by design. Lint/typecheck/build, guarded Preview/public smoke PASS. Owner после реального login подтвердил controls, archive confirmation, archived/restore presentation, 390/768/1024/1440, отсутствие overflow и согласованность с Admin shell. Временный no-write visual-check route удалён. Production/main unchanged; M3 и Development Gate PASS; Production Content Gate BLOCKED. Next T031, not started.

### T031 — Category management

- **ID:** T031
- **Priority:** P0
- **Status:** DONE
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
- **Resolution (2026-10-01):** `/admin/categories` предоставляет список, честное пустое состояние и общую create/edit форму с проверкой title/slug/sort/SEO, безопасной обработкой дублированного slug, draft при создании и запретом смены slug опубликованной категории. Чтение и изменения используют `requireAdmin()` / same-origin `requireAdminMutation()`, authenticated JWT и T017 RLS; поля записи ограничены явным allowlist. Транзакционные Preview TEST_ONLY проверки create/edit/duplicate, anon visibility, admin/non-admin доступа и запрета DELETE прошли с ROLLBACK; постоянных synthetic categories/products/rows — 0. Lint/typecheck/build и guest/public smoke PASS; T028–T030 не изменены. Владелец после реального login подтвердил список, empty/create/edit, поля и статус, отсутствие Delete и вложенности, 390/768/1024/1440, отсутствие overflow, чистую console и согласованность с Admin shell. Временный no-write visual harness удалён. Production/main unchanged; M3 и Development Gate PASS; Production Content Gate BLOCKED. Next T032, not started.

### T032 — Category publication behavior

- **ID:** T032
- **Priority:** P0
- **Status:** DONE
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
- **Resolution (2026-10-01):** Отдельные server actions публикуют/скрывают только `categories.is_published` после `requireAdminMutation()`, authenticated admin JWT/T017 RLS и same-origin guard; обычная форма T031 больше не меняет publication state. Точная server-side count выборка охватывает только REAL, published, non-archived children; подтверждения объясняют возврат видимости без удаления/архива/смены статуса товаров. Published slug защищён от скрытой смены. Транзакционные Preview TEST_ONLY проверки подтвердили category hide/republish, anon visibility по T014, неизменность всех полей трёх child rows, отсутствие cascade и запрет DELETE; TEST_ONLY продукты остаются anon hidden по дизайну, REAL positive path подтверждён T014 policy и предыдущими RLS checks. Non-admin/anon mutations denied; все fixtures откатились, permanent synthetic categories/products/rows 0. Lint/typecheck/build и guarded/public smoke PASS. Владелец после реального login подтвердил оба состояния, count, предупреждения, slug note, отсутствие Delete, 390/768/1024/1440, отсутствие overflow, чистую console и Admin consistency. Временный no-write visual harness удалён; реальная T032 реализация сохранена. Production/main unchanged; M3 и Development Gate PASS; Production Content Gate BLOCKED. T032A supersedes only the global product visibility dependency on category; T032 remains historically DONE. Next T032A, not started.


### T032A — Multi-category catalog model

- **ID:** T032A
- **Priority:** P0
- **Status:** DONE
- **Title:** Multi-category catalog model
- **Goal:** Перевести Preview на many-to-many категории без копирования товаров; закрепить системное «Все товары», безопасное удаление пользовательских категорий и новую публичную видимость.
- **Why:** Один SKU остаётся одной строкой продукта при 0, 1 или нескольких пользовательских категориях; глобальный каталог не зависит от состояния одной категории.
- **Dependencies:** T032.
- **Allowed scope:** Preview migration/backfill, grants/RLS, минимальная адаптация затронутых Admin flows и public query boundary; targeted tests и cleanup.
- **Forbidden scope:** Production, synthetic REAL SKU, дубли товаров/цен/изображений/SEO/commercial data, изменение order/media/Auth, редизайн Admin, начало T033 или соседней TASK.
- **Source of truth:** docs/ARCHITECTURE.md (целевая T032A модель); T012/T014/T017 и T024/T026–T032 как legacy implementation baseline.
- **Schema/migration:** `product_categories(product_id FK, category_id FK)` с composite UNIQUE и индексами product/category lookup. До удаления `products.category_id` перенести каждую существующую непустую связь, доказать отсутствие потерь/дублей и переключить Admin/query/RLS; не оставлять dual source of truth. Допустить 0 user categories. Category DELETE удаляет только её membership rows (допустим category→relation cascade), без product cascade.
- **System All:** «Все товары» всегда существует как системное представление, не строка `categories`, не editable slug и без per-product membership. `/catalog` содержит все допустимые REAL published non-archived products. В `/admin/categories` оно первым, с badge «Системная» и count всех operational products; Edit/Publish/Unpublish/Delete отсутствуют. `/product/[slug]` тоже не зависит от пользовательской категории.
- **Admin changes:** T028/T029 product create/edit валидируют 0+ category IDs server-side и меняют только memberships той же product row; duplicate membership запрещена. Адаптировать T024 dashboard, T026 list/category presentation, T027 category filter, T028 create, T029 editor, T030 state controls, T031 category management, T032 publication UI без лишнего редизайна. Category delete confirmation содержит название и точный count связанных products: «Будет удалена только категория и её связи. Сами товары останутся в «Все товары» и других категориях». Product flags/commercial fields/images/SEO сохраняются.
- **Public/RLS target:** anon `products` SELECT только REAL published non-archived без обязательной категории; anon `categories` SELECT только published user categories; anon `product_categories` SELECT только relation public-visible product + published category. `/catalog/[category]` выбирает только связанные товары опубликованной категории. Hide/delete пользовательской категории скрывает только её маршрут/список; `/catalog`, Product Detail и другие memberships не меняются. Active admin получает membership SELECT/INSERT/DELETE и category CRUD через authenticated JWT/RLS; anon/non-admin mutation DENIED; Admin Secret client не использовать. Published category slug остаётся защищённым.
- **Acceptance criteria:** many-to-many schema и legacy backfill PASS; один product UUID в нескольких категориях без копий; duplicate membership DENIED; 0 user categories допустимы и продукт остаётся в «Все товары»; системный пункт не edit/hide/delete; обычная категория удаляется только вместе со своими связями, product и остальные memberships сохраняются; hide/delete не меняет product flags или глобальную видимость; T024/T026–T032 regressions PASS; anon/non-admin membership mutation DENIED; permanent synthetic rows 0; Production unchanged.
- **Required checks:** Preview TEST_ONLY transaction с обязательным rollback: product с 0, 1, 3 categories; duplicate membership DENIED; remove one link и delete category сохраняют product и другие links; один product UUID из разных категорий и редактирование той же row; «Все товары» всегда включает product; hide сохраняет флаги; delete count верный. Проверить public RLS для глобального и category route (TEST_ONLY остаётся скрыт anon), отсутствие synthetic REAL rows; backfill integrity, anon/non-admin mutation denial, Admin T024/T026–T032 regressions, permanent synthetic cleanup. Lint, typecheck, build, responsive 390/768/1024/1440, horizontal overflow NO, console clean. Только Preview; Production unchanged.
- **Recommended model:** GPT-6 Sol High
- **Reasoning level:** High
- **Additional agent:** NO
- **Suggested commit message:** task(T032A): multi-category catalog model
- **Resolution (2026-10-01):** Preview migration applied with legacy backfill integrity guard (zero legacy products), composite membership key/FKs/index/RLS/grants verified and `products.category_id` removed. Transactional TEST_ONLY 0/1/3 membership, duplicate denial, relation removal/category deletion preserving the same product and other links, category hide, anon isolation and active/non-admin boundaries PASS with rollback; permanent synthetic products/categories/relations 0. Admin flows T024/T026–T032 adapted without product duplication; global REAL published non-archived visibility no longer depends on a user category. Product Create/Edit use compact multiselect with existing `category_ids` validation. Lint/typecheck/build PASS. Owner after real admin login confirmed System All, Create/Edit dropdown and 0/multiple/remove states, internal scroll, keyboard/Escape/outside click, delete and publication warnings, 390/768/1024/1440, no overflow, clean console and Admin consistency. Temporary Preview-only no-write visual harness removed. Production/main unchanged; Development Gate PASS, Production Content Gate BLOCKED. Next T033, not started.


## PHASE 7 — Admin Media Management

### T033 — Admin Storage policies

- **ID:** T033
- **Priority:** P0
- **Status:** DONE
- **Title:** Admin Storage policies
- **Goal:** Разрешить media операции только активному admin.
- **Why:** Browser upload должен работать без secret.
- **Dependencies:** T032A.
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
- **Resolution (2026-10-01):** Preview-only migration `20261001065527_admin_storage_policies.sql` applied with matching history. Three narrow `storage.objects` policies permit active authenticated admin INSERT/SELECT/DELETE only in `product-media/products/<UUID>/<generated-key>.<ext>`; no UPDATE/upsert policy. Existing public bucket, 12 MiB limit and four image MIME types unchanged. Owner verified the real admin JWT through a temporary Preview-only same-origin endpoint: upload, scoped list, delete, public URL read and cleanup PASS; anon upload/delete, wrong bucket/prefix, unsupported MIME and overwrite DENIED, original bytes unchanged. Non-admin writes remain denied by the active-membership RLS predicate; no broad mutation policy was added. The diagnostic endpoint was removed after verification. Permanent test objects, synthetic DB rows and temporary Auth accounts are 0; one real active admin remains. Security Advisor has no blocking findings; the existing leaked-password warning remains a pre-production item. Production unchanged. Next T034, not started.

### T034 — Media upload и preview

- **ID:** T034
- **Priority:** P0
- **Status:** DONE
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

- **Progress (2026-10-01):** Preview-only migration `20261001073651_media_draft_nullable.sql` applied with matching history after confirming zero existing image rows; only `product_images.role` and `alt` became nullable for draft media. No semantic defaults or T035 controls. Product Editor now uses browser publishable key with authenticated cookie session for Storage upload, generated per-product UUID path and no upsert; a same-origin guarded Server Action verifies existing product, exact path, object metadata and dimensions before inserting a draft relation with NULL role/alt. Partial metadata failure attempts object cleanup; ambiguous response is checked before deletion. Existing images and preview, multi-file picker with individual previews/status, local per-file format/size validation and safe errors implemented. Each successful file gets its own object key and stable image row ID; failures are isolated, and later additions append without product duplication. Before upload, each queued file has a keyboard-accessible local-only «Убрать» action; uploaded images have no Delete control (T036). Validation/path cases and transactional authenticated admin 1/3/repeat image rows on one product with rollback PASS; that earlier test left no fixtures. Prior T033 real-admin Storage API smoke proves its RLS boundary; owner visual and real-admin browser batch upload/link, reload and repeat addition PASS. Lint/typecheck/build PASS, Security Advisor has no new blocking findings. Temporary no-write media-review screen removed in cleanup changes. Four linked image rows and TEST_ONLY product deleted after Storage image removal. Dashboard folder placeholders removed via Storage UI. Direct Preview verification: synthetic products 0, `product_images` 0, `product-media` Storage objects 0. T034 DONE; Production untouched; T035 not started.

### T035 — Image metadata и primary

- **ID:** T035
- **Priority:** P0
- **Status:** DONE
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

- **Resolution (2026-10-01):** Preview migrations `20261001124018_media_metadata_primary.sql` и `20261001124304_product_media_publication_guard.sql` применены с matching history: SECURITY INVOKER + RLS, active membership, exact image set/ownership validation, atomic order/alt/role/primary save under product row lock and existing unique-primary index; publish transition requires primary and complete alt/role, без backfill REAL. Product Editor uses compact media cards, drag handle, keyboard/mobile reorder, main preview, explicit primary, controlled roles and alt; T034 multiple upload/queue/append preserved. No uploaded-image Delete. Transactional TEST_ONLY reorder/persistence, primary transition/uniqueness, alt/role, foreign-image/non-admin/validation/publication checks PASS with rollback; products/images/Storage after tests 0. Owner real-admin visual verification PASS for 1/3/8 image cards, drag and keyboard/mobile reorder, primary/metadata/save states, T034 queue, 390/768/1024/1440, no overflow and clean console. Temporary no-write review screen and preview-only branch removed. Lint/typecheck/build PASS; Production unchanged. T035 DONE; next T036, not started.

### T036 — Safe image removal

- **ID:** T036
- **Priority:** P0
- **Status:** DONE
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

- **Progress (2026-10-01):** Preview migration `20261001140002_protect_published_primary_delete.sql` applied with matching history; a direct authenticated DB DELETE of a published primary is denied without changing RLS/Storage policies. Product Editor has per-image confirmation, guarded exact-row detach before single-object Storage removal, explicit partial-failure warning, scoped orphan scan/retry, and a guarded no-write Preview review screen. Transactional TEST_ONLY direct DB matrix for non-primary, published primary denial, draft primary and last draft image PASS with rollback. Owner visual/responsive verification PASS for confirmation, published-primary block, draft deletion states, failure warning and retry at 390/768/1024/1440, no overflow/console error. A temporary guarded Preview-only browser smoke prepares three technical images on one TEST_ONLY product through the owner's normal admin session: normal deletion B, primary preservation A, controlled Storage failure after C detach and real orphan retry. The simulation is restricted to that fixture and never changes schema/RLS/Storage policies. Lint/typecheck/build PASS. Owner real-admin browser B deletion and C failure/retry PASS. Direct Preview verification confirms B/C image rows and objects absent, C public URL no longer serves an image, A primary row/object intact and orphan count 0. Retry now checks actual object absence before reporting success. Temporary smoke/no-write routes and fault simulation removed. Owner final A deletion, confirmation and reload persistence PASS. Direct Preview DB/Storage verification: A relation/object absent; A and C public URLs no longer serve images. Trusted exact-ID TEST_ONLY product cleanup completed only after confirming no image rows, memberships or Storage objects. Final synthetic products 0, test image rows 0, product-media Storage objects 0 and orphans 0. Temporary routes and fault simulation removed; lint/typecheck/build PASS. T036 DONE; Production unchanged; next T037 not started.

### T037 — Media presentation verification

- **ID:** T037
- **Priority:** P1
- **Status:** DONE
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

- **Resolution (2026-10-02):** Next/Image uses a narrow Preview `product-media/products/**` Storage remote pattern; Admin media previews use recorded image dimensions and responsive sizes, while local showroom Hero alone preloads and secondary media stays lazy. A temporary no-write Preview review of T010 manifest product primary/detail and neutral interior/application sources verified rights, role, alt, crop, network and color presentation. Owner visual verification PASS for representative large/card/detail/interior frames, texture/color fidelity, the 656×656 primary presentation, 390/768/1024/1440 and 1920/2560 sanity, no stretch/overflow or application console errors. The temporary route and three exact source patterns were removed after verification. T034–T036 mutation logic, schema and RLS unchanged; Production unchanged. This representative PASS is **not** full Production quality approval of the unique media set; selected assets still require pre-production owner sign-off. T037 DONE; next T038, not started.

### T038 — Verified catalog population

- **ID:** T038
- **Priority:** P0
- **Status:** DONE
- **Title:** Verified catalog population
- **Goal:** Ввести небольшой проверочный набор утверждённых SKU через Admin Panel.
- **Why:** M4 требует проверить реальные операции на настоящих данных.
- **Dependencies:** T037.
- **Allowed scope:** Небольшой набор реальных SKU из docs/CONTENT_FACTS.md с только подтверждёнными полями через Admin в Preview; проверка полного launch ассортимента — перед production readiness.
- **Forbidden scope:** Прямой seed без причины, вымышленные цены. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md; docs/CONTENT_FACTS.md (T008–T010).
- **Implementation notes:** Использовать формы admin; неполный реальный SKU может быть visible non-orderable. Отдельные TEST_ONLY fixtures для расчётов не смешивать с реестром. Полноту launch ассортимента проверять перед production readiness.
- **Acceptance criteria:** Проверенный набор товаров доступен, публикация и media работают.
- **Required checks:** выборочная сверка реестра↔admin↔public read.
- **Recommended model:** GPT-6 Luna Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T038): Verified catalog population
- **Resolution (2026-10-02):** Owner correction обновила source of truth: 226 confirmed panel SKU имеют `price_unit = м²`, `sale_unit = sheet`, min/step 1 и площадь листа 4.0328 м²; 14 «Гибкая доска» имеют те же units/min/step, но `area_per_sale_unit_m2 = NULL`; accessories сохраняют обе единицы `шт./упаковка` и min/step 1. Через Custom Admin в isolated Preview внесены и оставлены три REAL SKU: `MF-MAR-0086` (Азур), `MF-TRV-0003` (Травертин 1), `MF-ACC-0005` (Клей для гибкого камня базовый 3 кг). Их Registry→Admin/DB round-trip PASS, точные категории/memberships и manifest media PASS; у каждого одна product row, одна membership и одно primary media с owner-confirmed `neutral_texture`/alt. Все три published и видны anon согласно существующей T014/T032A модели; предыдущий targeted draft/unpublished smoke подтвердил anon denial и запись была возвращена в published. Availability остаётся NULL, featured=false, unresolved values NULL; тестовые TEST_ONLY products/categories/images=0, orphan objects=0. Dashboard показывает 3 published, 0 hidden/archived; Products list содержит ровно три без дублей; Categories содержит только три owner-requested user categories плюс virtual «Все товары», category/product/media/admin integration PASS. Owner data verification PASS. Эти три записи остаются в Preview и не означают полный 251-SKU launch import или Production media approval. Full catalog completeness проверяется перед Production Readiness. M4 PASS; Development Gate PASS; Production Content Gate BLOCKED; T038 DONE; next T039, not started; Production unchanged.


## PHASE 8 — Public Catalog

### T039 — Public catalog read layer

- **ID:** T039
- **Priority:** P0
- **Status:** DONE
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
- **Resolution (2026-10-02):** Единый server-only `src/lib/catalog` предоставляет `listPublishedProducts`, `getPublishedProduct` и `getCatalogFacets` через существующий guest publishable client, без Admin cookies/Secret key. REAL/published/unarchived и published membership фильтруются явно поверх RLS; System All не зависит от категорий. DTO сохраняет NULL, panel `sale_unit = sheet`, source price range и только primary на списке; detail возвращает ordered media. Sort/page whitelist, bounded page size 24, deterministic `sort_order,id` и count защищают пагинацию. Публичный cache: `unstable_cache`, TTL 60 секунд и теги `catalog:list`, `catalog:facets`, `catalog:product:<slug>`, `catalog:category:<slug>`; адресную Admin revalidation подключить в будущей задаче, TTL задаёт резервный интервал revalidation. Preview live read трёх T038 REAL SKU, nullable/media/units/facets и invalid slug/page PASS; transactional RLS negative fixtures для draft/archived/TEST_ONLY/hidden category и order privacy PASS с rollback; permanent fixtures 0. Временный read-only route удалён; Production не менялась. T039 DONE; next T040, not started.

### T040 — Catalog и category routes

- **ID:** T040
- **Priority:** P0
- **Status:** DONE
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
- **Resolution (2026-10-02):** Server-rendered `/catalog` and `/catalog/[category]` use only the T039 public read layer. System All renders the three existing published REAL products with primary Next/Image, factual names, exact prices and preserved price/sale units; no Product Detail/cart/search/filter/pagination action was added. Category route returns 404 for unpublished and missing slugs without exposing hidden membership; all three existing categories remain unpublished. Positive category presentation passed through a temporary render-only route with controlled props and one existing public product, then the route was removed; no DB fixtures or mutations. Lint, typecheck, build and live route smoke PASS; owner Vercel Preview visual verification PASS for desktop/mobile, media, card/grid, breadcrumb and no horizontal overflow. Production unchanged; T040 DONE, next T041 not started.

### T041 — Search/filters/sort/pagination

- **ID:** T041
- **Priority:** P0
- **Status:** DONE
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
- **Resolution (2026-10-02):** GET URL state on `/catalog` uses one extended T039 normalizer and server-only public queries for name/SKU search, exact `price_minor` ranges, factual status/published-category facets, whitelisted default/price sorting and fixed-size page navigation. Invalid input is normalized safely; out-of-range pages remain empty; price NULL sorts last and `id` breaks ties. Forms reset page on new criteria, pagination links retain active criteria, and empty category/status facets render no options. Live read-only Preview tests covered the three REAL SKU, min/max/combined prices, search, sort, hidden category, invalid values and no-results; parser/link tests covered page bounds, preserved URL state and page reset. READY Preview browser search/reset/sort/direct URL/refresh/Back/Forward/keyboard/console PASS. Owner visual verification PASS for 390/768/1024/1440, no overflow, factual facets and unchanged T040 cards. No product/category/schema/RLS/Storage/Production mutation; T041 DONE, T042 not started.

### T042 — Catalog states и responsive

- **ID:** T042
- **Priority:** P1
- **Status:** DONE
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
- **Resolution (2026-10-02):** T040 Product Card composition retained; long names/price units wrap, NULL price uses a neutral dash with accessible label, NULL media has a neutral empty frame, and missing availability does not become a badge or claim. Existing Next/Image primary mapping and lazy card loading preserved. Catalog-only loading mirrors image/card dimensions without screen-reader noise, true zero published products and filtered no-results use separate messages, and route errors keep a generic retry without backend details. Read-only READY Preview showed the three owner-confirmed REAL SKU with exact prices/units, loaded primary images, hidden-category 404, search/price/sort/reset/URL behavior, and no app console errors. Render-only Preview checked empty/no-results/error/loading/long and NULL states without DB writes; owner visual verification PASS at 360–370/390/768/1024/1440/1920/2560 with no page overflow and Dark Gold Showroom consistency. Temporary review route removed before final commit. Lint/typecheck/build and final catalog route smoke PASS; Supabase data/schema/RLS/Storage and Production unchanged; permanent TEST_ONLY 0. T042 DONE; T043 not started.

### T043 — Home с проверенными данными

- **ID:** T043
- **Priority:** P0
- **Status:** DONE
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
- **Resolution (2026-10-02):** Homepage featured products use the existing T039 server-only public guest read: REAL, published, unarchived, `is_featured=true`, stable `sort_order`/`id` ordering and at most three items. Published featured REAL count is 0; the homepage shows a quiet catalog link, without changing the three T038 SKU or inventing items. Prototype names, prices, filters and modal were removed. Hero composition and Dark Gold Showroom direction remain; Showcase media is explicitly described as visualization, application copy makes no new technical claim, and closing/catalog CTAs lead to `/catalog`. READY Preview homepage and catalog transition PASS; owner visual verification PASS at 360–370/390/768/1024/1440/1920/2560, no overflow, demo products/prices 0, invented business facts 0 and no application console errors. Lint/typecheck and READY Vercel build PASS; local build access to Google Fonts remained an environment limitation. Supabase data/schema/RLS/Storage, main and Production unchanged. T043 DONE; T044 not started.


## PHASE 9 — Product Detail

### T044 — Product route и серверные данные

- **ID:** T044
- **Priority:** P0
- **Status:** DONE
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
- **Resolution (2026-10-02):** Server-rendered `/product/[slug]` reuses T039 `getPublishedProduct()` with the public guest client, its RLS and product cache. T032A supersedes category-dependent Product Detail visibility; hidden user category does not hide a globally published REAL product. All three T038 REAL routes resolved in READY Preview with exact identity, price unit and sale unit, one mapped primary image, Home → Catalog → Product breadcrumb, and no invented availability. Missing and malformed slugs returned the same 404; unchanged T039 REAL/published/unarchived filters and earlier negative RLS checks cover draft, archived and TEST_ONLY exclusion without persistent fixtures. No gallery/specifications/quantity/cart implementation. Lint/typecheck and Vercel READY build PASS; local build was blocked solely by Google Fonts network access. Owner visual verification PASS at 360–370/390/768/1024/1440/1920/2560 with no horizontal overflow and Dark Gold Showroom consistency. Production and Supabase data/schema/RLS/Storage unchanged; permanent TEST_ONLY 0. T044 DONE; T045 not started.

### T045 — Gallery, specs и related

- **ID:** T045
- **Priority:** P0
- **Status:** DONE
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
- **Resolution (2026-10-03):** T039 ordered `getPublishedProduct()` images feed a server Product Detail, with a small client island only for 2+ images. Current three REAL products each have one primary image and no redundant selectors; a temporary render-only mixed-media review verified primary selection, ordered thumbnails, arrows, focus, alt and reduced motion, then was removed. Azur and Travertin show only 142 × 284 cm and exact 4,0328 m²; glue has no specs section. Related uses the guest public client with REAL/published/unarchived filters, same non-null series before shared published public categories, stable sort, current-product exclusion, de-duplication and limit three. Hidden categories produce no public relation; live related counts are 0/0/0 and sections are omitted. Lint/typecheck, isolated related selection, Vercel READY build and three Product Detail smoke PASS; local build was blocked solely by Google Fonts network access. Owner visual verification PASS at 360–370/390/768/1024/1440/1920/2560, with no overflow and Dark Gold Showroom consistency. T044 regression PASS. No Supabase data/schema/RLS/Storage or Production mutation; permanent TEST_ONLY 0. T045 DONE; T046 not started.

### T046 — Quantity UI и покупательский блок

- **ID:** T046
- **Priority:** P0
- **Status:** DONE
- **Title:** Quantity UI и покупательский блок
- **Goal:** Добавить выбор количества по шагу и ясное будущее действие.
- **Why:** Цена и единица должны быть понятны до Cart.
- **Dependencies:** T045.
- **Allowed scope:** Вычисление видимого итога, disabled если недоступно.
- **Forbidden scope:** Фиктивное добавление до cart state и online payment. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md; docs/CONTENT_FACTS.md (T008–T010).
- **Implementation notes:** Для неполного реального SKU не показывать вычисленный итог, оставить действие disabled; add-to-cart запланирован в T049 после cart model.
- **Acceptance criteria:** Шаг/минимум работают, действие до T049 честно недоступно.
- **Required checks:** targeted quantity tests, viewport smoke.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T046): Quantity UI и покупательский блок
- **Resolution (2026-10-03):** Existing T045 Product Detail remains server-rendered; only the quantity block is a small client island. Verified review implementation starts at the confirmed minimum and changes by the confirmed step, labels panel quantity as лист and accessory quantity as шт./упаковка, and computes sheet area from exact 4.0328 m² without monetary floating point or unapproved rounding. A guarded public commerce evaluator requires REAL/published/unarchived eligibility, fixed exact price conversion, valid sale unit and minimum/step, and explicit availability before exposing a monetary total. Current three REAL products have NULL availability, so no total appears and the buyer action remains disabled with no cart/localStorage side effect. Missing Flexible Board area and range/nullable price also block a total. A render-only technical positive fixture checked exact minor-unit totals and increment behavior without DB writes; its temporary route was excluded from the final tree. Lint/typecheck, Vercel READY build, real routes and technical fixture PASS; owner visual verification PASS at 360–370/390/768/1024/1440/1920/2560, with no overflow and T044/T045 regression PASS. No Supabase schema/data/availability/Storage or Production mutation; permanent TEST_ONLY 0. T046 DONE; T047 not started.


## PHASE 10 — Cart

### T047 — Cart state model

- **ID:** T047
- **Priority:** P0
- **Status:** DONE
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
- **Resolution (2026-10-03):** Pure TypeScript cart model uses version 1, canonical empty state and product_id as its sole line identity. Target-quantity upsert appends new products, updates existing lines in place and is idempotent for repeats; update validates existing lines, remove is idempotent. The shared T046 `validQuantity` semantics enforce safe integer min/step/max without rounding or mutation on invalid input. Optional minimal display snapshots are copied and explicitly non-authoritative for eligibility, price and order totals. No cart total, browser persistence, React provider, Product Detail integration or backend cart was introduced; persistence is T048, UI integration T049. Targeted pure-model assertions, lint and typecheck PASS; T046 helper and disabled action unchanged. No Supabase or Production mutation; T047 DONE, T048 not started.

### T048 — localStorage и hydration

- **ID:** T048
- **Priority:** P0
- **Status:** DONE
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
- **Resolution (2026-10-03):** Browser-only adapter uses stable `marmix-flex:cart` key and an explicit v1 decoder. Unknown versions or corrupt/oversized roots reset to canonical empty v1 with `storage_recovered`; malformed lines are discarded, snapshot fields whitelisted, and duplicate product IDs keep first position with latest valid target quantity (never summed). Storage exceptions yield usable in-memory state and machine-readable `storage_unavailable`. Minimal CartProvider exposes `hydrating` before an effect reads storage, then `ready`; writes start only after the initial read, preventing EMPTY_CART overwrite and SSR mismatch. It delegates upsert/update/remove to T047. Targeted parser/model tests and READY Preview technical reload/recovery smoke PASS, with no application hydration warnings; the temporary technical route was removed from the final tree. Lint/typecheck and Vercel READY build PASS; local build was blocked only by Google Fonts network access. Product Detail integration remains T049; price/product refresh and current totals remain T050. No permanent public UI, Supabase/backend or Production change; permanent TEST_ONLY 0. T048 DONE; T049 not started.

### T049 — Add/remove/update интеграция

- **ID:** T049
- **Priority:** P0
- **Status:** DONE
- **Title:** Add/remove/update интеграция
- **Goal:** Подключить Product Detail и карточки к корзине.
- **Why:** Покупка должна работать, когда state готов.
- **Dependencies:** T048.
- **Allowed scope:** Кнопки добавить/удалить/изменить, count в header.
- **Forbidden scope:** Checkout API, analytics. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md.
- **Implementation notes:** Учитывать шаг, статус и commercial_ready; реальный non-orderable SKU не добавлять. UI guard не заменяет серверную проверку на order submit.
- **Acceptance criteria:** Из товара можно добавить и удалить; count синхронен.
- **Required checks:** interaction smoke 1440/390, typecheck.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T049): Add/remove/update интеграция
- **Resolution (2026-10-03):** T048 CartProvider is mounted only inside the public Server Component layout. Small client islands connect T046 Product Detail quantity to T047 target-quantity upsert/update/remove, add a ready-only minimum-quantity Product Card action, and show Header count as unique cart positions (`lines.length`), with no false zero before hydration or link to nonexistent `/cart`. The three REAL Preview SKU remain non-orderable because availability is NULL; their Add controls stay natively disabled and their catalog cards have no cart action. A render-only technical fixture evaluated through T046 `evaluateCommerce()` validated Add, repeat idempotency, Update to three sheets, Remove, card Add, Header count and reload persistence without Supabase rows. Technical cart lines were cleaned in the test browser and owner confirmed cleanup in their browser. Owner visual verification PASS at 1440/390, mobile menu and Dark Gold Showroom; no horizontal overflow. Lint/typecheck and READY Vercel build PASS; local build blocked only by Google Fonts access. Temporary technical route removed from final tree. Snapshot remains presentation-only; price refresh and `/cart` are T050. No backend cart, analytics, REAL data or Production mutation; permanent TEST_ONLY 0. T049 DONE; T050 not started.

### T050 — Cart page и price refresh

- **ID:** T050
- **Priority:** P0
- **Status:** DONE
- **Title:** Cart page и price refresh
- **Goal:** Реализовать /cart с проверкой текущего SKU/цены.
- **Why:** Перед отправкой покупатель видит актуальный итог.
- **Dependencies:** T049.
- **Allowed scope:** Items, quantity, empty/unavailable/changed price states.
- **Forbidden scope:** Создание order или backend cart. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; docs/DESIGN_SYSTEM.md.
- **Implementation notes:** При расхождении явно подтверждать новую цену перед checkout; если real SKU стал non-orderable, не вычислять фиктивный итог и не допускать к заявке.
- **Acceptance criteria:** Удалённый SKU отмечен, итог пересчитан по подтверждённым данным.
- **Required checks:** targeted refresh tests, browser smoke.
- **Recommended model:** GPT-6 Sol Medium
- **Reasoning level:** Medium
- **Additional agent:** NO
- **Suggested commit message:** task(T050): Cart page и price refresh
- **Resolution (2026-10-03):** `/cart` reconciles bounded validated product IDs in one fresh server batch through the public guest Supabase client and RLS, bypassing the application cache for each refresh without changing the T039 catalog query contract. Browser snapshots are presentation-only; current server product, price, unit, availability and quantity rules determine orderability and exact BigInt minor-unit line/cart totals. Missing and non-orderable lines stay visible until explicit removal; invalid quantity can be corrected. Changed price or unit requires explicit confirmation of current data before its line enters the total. Any unresolved line hides the cart total. Empty, hydration, loading and refresh error/retry states are distinct. Header links to `/cart` and counts positions. Owner visual verification PASS on READY Preview for normal and technical states at 1440/390 with no horizontal overflow, including exact 24 196,80 ₽ technical line total. Technical browser lines were cleared; temporary review route is absent from final tree; permanent TEST_ONLY 0. Lint/typecheck and Vercel READY build PASS; local build blocked only by Google Fonts network access. No checkout, order API, backend cart, Supabase REAL data or Production mutation. T050 DONE; T051 not started.


## PHASE 11 — Checkout / Order Request

### T051 — Checkout form и consent

- **ID:** T051
- **Priority:** P0
- **Status:** TODO
- **Title:** Checkout form и consent
- **Goal:** Сделать /checkout с минимальными контактными полями.
- **Why:** Заявка должна быть простой и законной.
- **Dependencies:** T050.
- **Allowed scope:** Preview форма для name/phone/city/email, optional comment, summary, client loading/errors; место для будущего юридически утверждённого согласия.
- **Forbidden scope:** Оплата, лишние персональные поля, backend mutations. Не начинать соседнюю TASK.
- **Source of truth:** docs/ARCHITECTURE.md; owner-confirmed order facts и pending legal review T009.
- **Implementation notes:** При session/cart проблеме сохранить понятный путь назад.
- **Acceptance criteria:** Preview форма доступна для TEST_ONLY сценариев, неверные поля отмечены; legal copy остаётся Pending owner/legal approval, без фиктивного текста consent и без production submit.
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
- **Source of truth:** docs/ARCHITECTURE.md; owner-confirmed order facts и pending legal review T009.
- **Implementation notes:** Проверить quantity, step, phone и SKU; production consent проверять лишь по юридически утверждённому тексту. Preview ограничить TEST_ONLY сценарием.
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
- **Source of truth:** docs/ARCHITECTURE.md; owner-confirmed order facts и pending legal review T009.
- **Implementation notes:** Существующий ключ сначала сопоставить с payload hash.
- **Acceptance criteria:** Changed price→409, identical retry→тот же номер, иной payload→conflict.
- **Required checks:** race/idempotency/price targeted tests на TEST_ONLY fixtures и отрицательный тест real non-orderable SKU; актуальная серверная eligibility проверка.
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
- **Source of truth:** docs/ARCHITECTURE.md; owner-confirmed order facts и pending legal review T009.
- **Implementation notes:** Secret не в bundle; ответ без контактов/internal note. В Preview создавать только TEST_ONLY заявки с синтетическими контактами; production commerce закрыт до Production Content Gate PASS.
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
- **Source of truth:** docs/ARCHITECTURE.md; owner-confirmed order facts и pending legal review T009.
- **Implementation notes:** Проверять 1440/390 и console/network этого flow.
- **Acceptance criteria:** M6 проверяет приватный и стабильный Preview flow на TEST_ONLY fixtures; реальные SKU без полного commercial набора отвергаются сервером. Production commerce остаётся заблокирован.
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
- **Allowed scope:** Preview /delivery и /contacts с подтверждёнными телефонами и городами; нейтральное pending состояние для неутверждённых подробностей.
- **Forbidden scope:** Непроверенная бесплатная доставка и устаревшие контакты. Не начинать соседнюю TASK.
- **Source of truth:** docs/CONTENT_AUDIT.md; T008–T010; docs/DESIGN_SYSTEM.md.
- **Implementation notes:** Условия доставки/самовывоза и адреса не придумывать; их production copy только после owner/legal sign-off.
- **Acceptance criteria:** Preview показывает два подтверждённых телефона и города, без выдуманного адреса/сроков/стоимости; production copy остаётся pending.
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
- **Goal:** Подготовить маршруты Privacy и Terms в Preview; production тексты только после legal sign-off.
- **Why:** Форма заявки с PII требует корректных ссылок.
- **Dependencies:** T061.
- **Allowed scope:** Preview routes /privacy и /terms с нейтральным pending state; будущая подстановка утверждённой редакции.
- **Forbidden scope:** Самостоятельное сочинение юридических обещаний. Не начинать соседнюю TASK.
- **Source of truth:** docs/CONTENT_AUDIT.md; T008–T010; docs/DESIGN_SYSTEM.md.
- **Implementation notes:** Пока тексты не утверждены, Preview показывает только Pending owner/legal approval; никакого вымышленного consent/return policy. Production content остаётся BLOCKED.
- **Acceptance criteria:** Preview маршруты доступны с честным pending state; production checkout consent и legal pages не готовы без проверенной политики и sign-off.
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
- **Dependencies:** T071; Production Content Gate PASS и отдельное разрешение на production readiness.
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
- **Acceptance criteria:** Все M1–M7, Production Content Gate PASS, legal sign-off и полный owner-confirmed launch content подтверждены; при BLOCKED не объявлять production candidate.
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
- **Acceptance criteria:** M8: production candidate только при PASS Production Content Gate и остальных readiness checks; иначе точный blocker и NO-GO. Production не запущен.
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

# Marmix Flex Redesign v2 — Current State

**Current stage:** T001–T007 DONE; M1 Foundation ready PASS; M2 Public visual foundation approved PASS. T008 не начата.

| Field | State |
|---|---|
| TASKS.md status | COMPLETE; 18 PHASE (0–17), 74 TASK (T001–T074); T001–T007 DONE, T008–T074 TODO. |
| Milestone status | M1 — PASS; M2 — PASS после T004–T007 и owner verification; последующие gates ожидают соответствующих TASK. |
| T007 implementation | Responsive и motion parity проверены; добавлен только утверждённый однократный reveal существующих сцен при прокрутке с IntersectionObserver. При отсутствии JS контент остаётся в серверном HTML; при prefers-reduced-motion: reduce reveal не скрывает контент. Implementation commit e28e252b646bd65b3b926e7441d59f5b9269e2bd. |
| Checks T007 | Targeted lint, typecheck и build PASS на актуальной публичной странице; SSR baseline PASS; HTTPS Preview READY; доступный browser viewport 1363px без overflow и ошибок приложения; scroll reveal срабатывает однократно. Header/mobile menu и keyboard ранее проверены, их implementation не менялась. |
| Owner verification T007 / M2 | Chrome Responsive Mode: 1440 × 900 PASS, 768 × 900 PASS, 390 × 844 PASS. Header/mobile navigation, Hero, Showcase, catalog fragment, Product Cards, application/interiors block, CTA, Footer, typography, imagery и spacing соответствуют утверждённому Dark Gold Showroom; horizontal overflow NO. В DevTools prefers-reduced-motion: reduce — PASS: контент виден, motion сокращён, меню и scroll/layout работают. |
| HTTPS Preview T007 | https://marmix-flex-redesign-v2-preview-l7koocl3p.vercel.app (source SHA e28e252b646bd65b3b926e7441d59f5b9269e2bd). Следующие commits создают отдельные branch Preview. |
| Content safety / production | Демонстрационные названия и цены не являются подтверждённым ассортиментом. Preview noindex; существующий production Marmix Flex и main не изменялись. |
| Current branch / remote HEAD | redesign-v2; после публикации этого checkpoint его commit является remote HEAD (точный SHA проверять через GitHub ref). Предыдущий проверенный HEAD: e28e252b646bd65b3b926e7441d59f5b9269e2bd. |
| Next TASK | T008 — Подтверждение товарного справочника. Только после отдельного запроса владельца. |
| Recommended model for T008 | GPT-6 Luna Medium; reasoning Medium; additional agent NO. |
| Next concrete step | Остановиться после remote verification T007/M2; T008 и Content Gate не начинать автоматически. |

**Источники истины:** [TASKS.md](TASKS.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Утверждённый [prototype](../prototype/index.html) остаётся visual reference.

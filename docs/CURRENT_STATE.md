# Marmix Flex Redesign v2 — Current State

**Current stage:** T001–T006 DONE; M1 Foundation ready PASS. T007 не начата.

| Field | State |
|---|---|
| TASKS.md status | COMPLETE; 18 PHASE (0–17), 74 TASK (T001–T074); T001–T006 DONE, T007–T074 TODO. |
| Milestone status | M1 — PASS; M2 и последующие gates ожидают соответствующих TASK. |
| T006 implementation | Homepage fragment каталога, 3 presentation Product Cards, локальный демо-фильтр, просмотр фактуры, application/interiors block и premium CTA перенесены из утверждённого prototype. Implementation commit 61b1f2ecec3378183bc395deaa94d08b06244e05. Настоящий /catalog, покупка, Cart и Supabase не начаты. |
| Content safety | Названия и цены карточек явно обозначены как демонстрационные; интерьерный кадр назван визуализацией. Демо-данные не являются подтверждённым ассортиментом и предложением Marmix Flex. |
| Checks T006 | Lint, typecheck, build PASS; HTTPS Preview и изображения работают; на доступной ширине 1363px overflow NO; ошибок приложения в консоли нет; демо-фильтр и просмотр фактуры проверены, Escape закрывает диалог с возвратом фокуса; reduced-motion CSS проверен. |
| Owner verification T006 | Chrome Responsive Mode: 1440 × 900 PASS, 768 × 900 PASS, 390 × 844 PASS. Catalog fragment, Product Cards, application block, CTA, typography и spacing соответствуют Dark Gold Showroom; цены и действия видны на mobile без hover; horizontal overflow NO. Это закрывает viewport acceptance criteria T006. |
| HTTPS Preview T006 | https://marmix-flex-redesign-v2-preview-gem80abjw.vercel.app (source SHA 61b1f2ecec3378183bc395deaa94d08b06244e05). Следующие commits создают отдельные branch Preview. |
| Security / production | Preview noindex; существующий production Marmix Flex и main не изменялись. |
| Current branch / remote HEAD | redesign-v2; после публикации этого checkpoint его commit является remote HEAD (точный SHA проверять через GitHub ref). Предыдущий проверенный HEAD: 61b1f2ecec3378183bc395deaa94d08b06244e05. |
| Next TASK | T007 — Responsive и motion parity. Только после отдельного запроса владельца. |
| Recommended model for T007 | GPT-6 Sol Medium; reasoning Medium; additional agent NO. |
| Next concrete step | Остановиться после remote verification T006; T007 не начинать автоматически. |

**Источники истины:** [TASKS.md](TASKS.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Утверждённый [prototype](../prototype/index.html) остаётся visual reference.

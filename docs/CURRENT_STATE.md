# Marmix Flex Redesign v2 — Current State

**Current stage:** T001–T007 DONE; M1 Foundation ready PASS; M2 Public visual foundation approved PASS; **T008 BLOCKED — owner confirmation required.**

| Field | State |
|---|---|
| TASKS.md status | 18 PHASE (0–17), 74 TASK (T001–T074); T001–T007 DONE, T008 BLOCKED, T009–T074 TODO. |
| Milestone status | M1 PASS; M2 PASS; Content gate ещё не пройден. |
| T008 research | [CONTENT_FACTS.md](CONTENT_FACTS.md) создан: 251 карточка публичного Marmix Flex на 25.09.2026, 8 существующих товарных групп; все строки имеют ссылку на текущий товар и статус опубликованной цены. 20 несовпадающих DOM/URL IDs, 2 группы совпадающих slug; реальные merchant SKU, утверждённый launch ассортимент, единицы продажи/min/step, актуальные цены и наличие не предоставлены. Демо данные prototype не включены. |
| T008 decision | BLOCKED: нельзя утверждать коммерческий реестр без owner sign-off. Нет согласованного launch SKU registry. [Owner Confirmation Required](CONTENT_FACTS.md#owner-confirmation-required) содержит точный шаблон нужной выгрузки и вопросы по исключениям. |
| Checks | 251 уникальный полный source URL, 251 уникальный DOM ID; 0 карточек без исходной группы или источника/price status; 2 группы коллизий slug; 20 расхождений source IDs; 20 диапазонов цен; технические code tests не нужны. |
| Current branch / remote HEAD | redesign-v2; T008 checkpoint commit становится HEAD после GitHub remote verification; его SHA фиксируется в отчёте и GitHub истории. Исходный HEAD до T008: b1e31edd54e815413dad4a475fee592a45846ee4. |
| Next task | T008 остаётся текущей заблокированной задачей. T009 — TODO и не начинается. |
| Next owner action | Предоставить таблицу по source URL ID из CONTENT_FACTS.md с включением в launch, merchant SKU, категорией/серией, единицей продажи и цены, минимумом/шагом, вариантами/размерами, актуальной ценой, availability и датой; отдельно ответить по двум «Калаката», 20 несовпадающим IDs/диапазонам и единицам у 12 карточек без подписи. Затем повторно сверить только затронутые строки и получить sign-off T008. |
| Recommended model to finish T008 | GPT-6 Luna Medium; reasoning Medium; additional agent NO. |
| Recommended model for T009 after T008 DONE | GPT-6 Luna Medium; reasoning Medium; additional agent NO. |

**Источники истины:** [TASKS.md](TASKS.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Approved prototype остаётся visual reference, не источником товара.

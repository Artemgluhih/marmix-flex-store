# Marmix Flex Redesign v2 — Current State

**Current stage:** T001–T007 DONE; M1 Foundation ready PASS; M2 Public visual foundation approved PASS; **T008 BLOCKED — owner confirmation required.**

| Field | State |
|---|---|
| TASKS.md status | 18 PHASE (0–17), 74 TASK (T001–T074); T001–T007 DONE, T008 BLOCKED, T009–T074 TODO. |
| Milestone status | M1 PASS; M2 PASS; Content gate ещё не пройден. |
| T008 research | [CONTENT_FACTS.md](CONTENT_FACTS.md) создан: 251 карточка публичного Marmix Flex на 25.09.2026, 8 существующих товарных групп; все строки имеют ссылку на текущий товар и статус опубликованной цены. 20 несовпадающих DOM/URL IDs, 2 группы совпадающих slug; реальные merchant SKU, утверждённый launch ассортимент, единицы продажи/min/step, актуальные цены и наличие не предоставлены. Демо данные prototype не включены. |
| T008 decision | BLOCKED: нельзя утверждать коммерческий реестр без owner sign-off. Нет согласованного launch SKU registry. [Owner Confirmation Required](CONTENT_FACTS.md#owner-confirmation-required) содержит точный шаблон нужной выгрузки и вопросы по исключениям. |
| Owner review artifact | [CATALOG_OWNER_REVIEW.md](CATALOG_OWNER_REVIEW.md) + [CATALOG_OWNER_REVIEW.csv](CATALOG_OWNER_REVIEW.csv): 251 строка, все SKU требуют подтверждения, Launch status UNDECIDED; исходные значения отделены от пустых owner confirmed полей. |
| Checks | 251 уникальный полный source URL, 251 уникальный DOM ID; 0 карточек без исходной группы или источника/price status; 2 группы коллизий slug; 20 расхождений source IDs; 20 диапазонов цен; технические code tests не нужны. |
| Current branch / remote HEAD | redesign-v2; T008 исходный checkpoint 8b15c3a0cbed5ffb0fe9737e12956a5244c42c87; после публикации owner-review checkpoint текущий SHA проверить через GitHub ref. |
| Next task | Owner review of CATALOG_OWNER_REVIEW; T008 остаётся BLOCKED до sign-off. T009 — TODO и не начинается. |
| Next owner action | **Owner review of [CATALOG_OWNER_REVIEW](CATALOG_OWNER_REVIEW.md)**: заполнить [CSV](CATALOG_OWNER_REVIEW.csv) по 251 source ID, выбрать INCLUDE/EXCLUDE, подтвердить SKU/прайс/единицы/min/step/размеры/availability для включаемых, разрешить 20 конфликтов ID и дополнительные вопросы по slug/вариантам. Затем сверить ответы с CONTENT_FACTS.md и получить sign-off T008. |
| Recommended model to finish T008 | GPT-6 Luna Medium; reasoning Medium; additional agent NO. |
| Recommended model for T009 after T008 DONE | GPT-6 Luna Medium; reasoning Medium; additional agent NO. |

**Источники истины:** [TASKS.md](TASKS.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Approved prototype остаётся visual reference, не источником товара.

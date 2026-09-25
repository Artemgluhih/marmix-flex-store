# Marmix Flex Redesign v2 — Current State

**Current stage:** T001–T007 DONE; M1 Foundation ready PASS; M2 Public visual foundation approved PASS; **T008 BLOCKED по конкретным коммерческим данным. T009 не начата.**

| Field | State |
|---|---|
| TASKS.md status | 18 PHASE (0–17), 74 TASK; T001–T007 DONE, T008 BLOCKED, T009–T074 TODO. |
| Milestone status | M1 PASS; M2 PASS; Content gate не пройден. |
| T008 owner confirmation (25.09.2026 Asia/Yekaterinburg) | D1–D10 применены к [CATALOG_OWNER_REVIEW.csv](CATALOG_OWNER_REVIEW.csv): 251 INCLUDE и 251 уникальный закреплённый SKU, 8 категорий, 7 featured, 231 фиксированная опубликованная цена подтверждена без изменения; 20 диапазонов без fixed price. [CONTENT_FACTS.md](CONTENT_FACTS.md) содержит актуальные подтверждённые факты и отдельно архив прежних наблюдений; [CATALOG_OWNER_DECISIONS.md](CATALOG_OWNER_DECISIONS.md) — текущие правила и блокеры. |
| Surface commerce rule | 240 SKU: цена/основа продажи м², минимум 1 sheet, шаг 1 sheet. Площадь и полный размер продаваемого листа неизвестны, формула лист → м² → итог заблокирована. |
| Accessory rule | 11 SKU: сумма цены подтверждена, price unit/sale unit/min/step не подтверждены, surface rule не применяется. |
| Availability | Разрешённые будущие статусы in_stock/on_order; все 251 per-SKU статусы пусты, public display hidden until admin assignment. Перед checkout назначить/определить политику неизвестной доступности. |
| Identity/claims | Две «Калаката» подтверждены разными товарами с разными SKU; public slug конфликтует. Старое заявление 25 лет не использовать, owner-confirmed срок 30 лет, область применения для SKU отдельно не установлена. 20 расхождений старых DOM/URL IDs сохранены как evidence и не блокируют новые идентификаторы. |
| Remaining blockers | 1) площадь/формат листа для расчёта 240 поверхностей; 2) 20 диапазонов цен; 3) единицы/минимум/шаг для 11 accessories; 4) уникальные public slugs для двух групп коллизий; 5) назначения availability/политика неизвестного статуса перед checkout. Полный список и 20 SKU цены: [CATALOG_OWNER_DECISIONS.md](CATALOG_OWNER_DECISIONS.md#remaining-blockers). |
| Current branch / remote HEAD | redesign-v2; после публикации этого checkpoint точный SHA проверить через GitHub ref. Предыдущий проверенный HEAD: ffeca5d7fb117497e3af730acb0f30fd65e820a3. main не изменять. |
| Next task | T008 остаётся BLOCKED до закрытия конкретных полей; T009 не начинать. |
| Next owner action | Передать формат/площадь листа по продаваемым поверхностям и вариантам; 20 фиксированных цен/вариантов; единицу цены/продажи и минимум/шаг для 11 accessories; решение по двум группам slug; политику и назначение availability перед приёмом заявок. Только затем перепроверить эти исключения. |
| Recommended model to finish T008 | GPT-6 Luna Medium; reasoning Medium; additional agent NO. |

**Источники истины:** [TASKS.md](TASKS.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Approved prototype — visual reference, не источник товарных фактов.

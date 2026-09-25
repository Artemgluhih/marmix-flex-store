# Marmix Flex Redesign v2 — Current State

**Current stage:** T001–T007 DONE; M1 Foundation ready PASS; M2 Public visual foundation approved PASS; **T008 BLOCKED по четырём конкретным коммерческим/routing вопросам; 226 панелей и availability policy подтверждены. T009 не начата.**

| Field | State |
|---|---|
| TASKS.md status | 18 PHASE (0–17), 74 TASK; T001–T007 DONE, T008 BLOCKED, T009–T074 TODO. |
| Milestone status | M1 PASS; M2 PASS; Content gate не пройден. |
| T008 owner confirmation (25.09.2026 Asia/Yekaterinburg) | D1–D10 применены к [CATALOG_OWNER_REVIEW.csv](CATALOG_OWNER_REVIEW.csv): 251 INCLUDE и 251 уникальный закреплённый SKU, 8 категорий, 7 featured, 231 фиксированная опубликованная цена подтверждена без изменения; 20 диапазонов без fixed price. [CONTENT_FACTS.md](CONTENT_FACTS.md) содержит актуальные подтверждённые факты и отдельно архив прежних наблюдений; [CATALOG_OWNER_DECISIONS.md](CATALOG_OWNER_DECISIONS.md) — текущие правила и блокеры. |
| Surface commerce rule | 240 SKU: price basis м², minimum/step 1 sheet; для 226 панелей из шести категорий подтверждено 142 × 284 см и точная площадь 4.0328 м². Формула sheets × 4.0328 × price/m² применима только к ним и при наличии fixed price; 14 гибких досок остаются без площади. Для 11 accessories panel dimensions не назначены. Денежное округление определить при реализации. |
| Panel confirmation (25.09.2026 Asia/Yekaterinburg) | 163 MAR + 14 CER + 12 TRV + 18 FLD + 7 BLK + 12 STN = 226 SKU с owner-confirmed 142 × 284 см и точной area 4.0328 м². UI может позже показывать 4.03 м², расчёт обязан использовать 4.0328. CSV хранит numeric area отдельным полем. |
| Accessory rule | 11 SKU: сумма цены подтверждена, price unit/sale unit/min/step не подтверждены, surface rule не применяется. |
| Availability | Политика подтверждена: при пустом статусе SKU виден в catalog/Product Detail, public status скрыт, add-to-cart/order submit запрещены. in_stock/on_order после назначения через Admin допускают заказ только при остальных готовых коммерческих полях; обязательная server-side validation. У всех 251 статус пока пуст, это не трактуется как наличие/под заказ. |
| Identity/claims | Две «Калаката» подтверждены разными товарами с разными SKU; public slug конфликтует. Старое заявление 25 лет не использовать, owner-confirmed срок 30 лет, область применения для SKU отдельно не установлена. 20 расхождений старых DOM/URL IDs сохранены как evidence и не блокируют новые идентификаторы. |
| Remaining blockers | Четыре: 1) площадь/размер продаваемой гибкой доски (14 SKU); 2) fixed price/варианты 20 диапазонов; 3) price unit/sale unit/min/step для 11 accessories; 4) public slug коллизии двух групп. Availability policy уже утверждена и не входит в список блокеров; пока SKU без назначенного статуса он не orderable. Полный список и 20 SKU: [CATALOG_OWNER_DECISIONS.md](CATALOG_OWNER_DECISIONS.md#remaining-blockers). |
| Current branch / remote HEAD | redesign-v2; после публикации этого checkpoint точный SHA проверять через GitHub ref. Предыдущий проверенный HEAD: c882697ff7806b77b81f1934151e34edfb1fa57b. main не изменять. |
| Next task | T008 остаётся BLOCKED до закрытия конкретных полей; T009 не начинать. |
| Next owner action | Предоставить размер/площадь листа для 14 гибких досок, 20 фиксированных цен/вариантов, коммерческие единицы/min/step для 11 accessories и решение по двум группам public slug. Назначение availability через Admin потребуется позже перед разрешением товара к заказу; политика неизвестного статуса уже утверждена. |
| Recommended model to finish T008 | GPT-6 Luna Medium; reasoning Medium; additional agent NO. |

**Источники истины:** [TASKS.md](TASKS.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Approved prototype — visual reference, не источник товарных фактов.

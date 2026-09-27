# Marmix Flex Redesign v2 — Current State

**Current stage:** T008, T009, T010 DONE; M1 PASS; M2 PASS; **Development Gate PASS** for isolated Preview work; **Production Content Gate BLOCKED** by 2 commercial T008 groups + 3 legal T009 groups (5 consolidated groups). Media rights/mapping blockers: 0. T011 remains TODO and is the next task.

| Field | State |
|---|---|
| Branch | `redesign-v2`; `main` unchanged. |
| TASKS status | T001–T010 DONE; T011–T074 TODO. Development Gate permits technical Preview work beginning with T011; this documentation update does not start it. |
| T008 status | DONE. Owner decisions C1–C4 applied 2026-09-27. 251 SKU identities preserved; 231 fixed prices unchanged; 20 range values remain source/display evidence only. |
| Flexible Board | 14 SKU: basis `м²`, minimum/step `1 sheet`; selling-format area unknown. No dimensions/area assigned; sheet-to-area total calculation BLOCKED. |
| Range prices | 20 SKU: 14 Flexible Ceramic `2 100—2 200 ₽/м²`; 6 Travertine `2 200—2 400 ₽/м²`. Variant-specific exact prices/rules pending; fixed price remains blank. |
| Accessories | 11/11 have owner-confirmed price/sale unit `шт./упаковка`, minimum `1`, step `1`; no `м²`, sheet, or panel area. |
| Public slugs | C4 assignments: `MF-MAR-0030 → kalakata-1`; `MF-MAR-0077 → kalakata-2`; acrylic coating routes use package weights. SKU identities unchanged; all 251 approved public slugs are unique. Legacy slugs preserved as source evidence. |
| Real catalog / Preview fixtures | Real 251 SKU retain only owner-confirmed facts; unknown values remain null/unresolved. Separate explicitly marked `TEST_ONLY` fixtures may use synthetic prices, dimensions, availability and conversion for targeted Preview tests. Fixtures cannot be imported into production catalog/seed or treated as owner facts. |
| Real SKU commerce | Published SKU with media may appear in Catalog/Product Detail while `commercial_ready=false`. Server orderability requires published product, complete commercial data, exact applicable price, valid quantity conversion and assigned `in_stock` or `on_order`; otherwise add-to-cart/order flow is forbidden. |
| Commercial blockers | 2: (1) area of the Flexible Board selling format for 14 SKU; (2) exact variant-specific price/rule for 20 range-price SKU. Accessory rule and public slug collisions resolved. |
| Legal blockers | 3 current T009 groups: seller/data-operator identity and legal privacy/consent sign-off; returns/claims policy and claims contact/legal review; detailed delivery/pickup terms. Resolved L3 request effect and L4 MVP payment baseline are not blockers. |
| Media | Rights/mapping blockers 0. Mixed homepage imagery requires neutral application/reference wording. Selected unique production assets still require owner quality review before launch; this is a separate pre-production quality check, not a media rights/mapping blocker. |
| Development Gate | **PASS** after T008–T010 for isolated Preview technical implementation with nullable real fields, separate TEST_ONLY fixtures and server commerce checks. |
| Production Content Gate | **BLOCKED**: 2 commercial + 3 legal = 5 consolidated groups; media blockers 0. Production readiness, commerce and deployment forbidden until PASS; selected-media visual sign-off remains required before launch. |
| Legal placeholders | Preview only: neutral `Pending owner/legal approval` or no production legal content. No invented seller identity, requisites, returns/claims policy or consent. |
| Next task | T011 — Supabase Preview environment, TODO. Begin only in its separate task; Production Content Gate is not a prerequisite for Preview T011. |

**Sources of truth:** [TASKS.md](TASKS.md), [CONTENT_FACTS.md](CONTENT_FACTS.md), [CATALOG_OWNER_REVIEW.csv](CATALOG_OWNER_REVIEW.csv), [CATALOG_OWNER_DECISIONS.md](CATALOG_OWNER_DECISIONS.md), [LEGAL_OWNER_DECISIONS.md](LEGAL_OWNER_DECISIONS.md), [MEDIA_MANIFEST.csv](MEDIA_MANIFEST.csv), [MEDIA_OWNER_DECISIONS.md](MEDIA_OWNER_DECISIONS.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

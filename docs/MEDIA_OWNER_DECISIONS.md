# Marmix Flex — Media Owner Decisions

**Актуально на:** 26.09.2026 — owner confirmations M1–M7 applied.  
**T010:** DONE. **T011:** не начинать.  
**Content Gate:** BLOCKED из-за четырёх товарно-коммерческих групп T008 и owner/legal sign-off T009. Media rights/mapping blockers: 0.

## Current media decision summary

- 904 usage rows: 808 product-gallery placements, 91 homepage references (60 mixed-gallery + 31 other homepage visuals), and 5 prototype assets.
- 889 unique source references after deduplication; 793 unique product-gallery URLs.
- 251/251 SKU have an owner-confirmed product-page gallery mapping and a primary candidate; 0 ambiguous primary SKU. The intentional shared-image assignments remain separate SKU identities.
- Product-gallery roles: 251 `product_primary`, 549 `product_detail`, 8 `interior_application` placements. If an individual role is unclear, use `unknown` while retaining the source-page SKU mapping.
- OWNER CONFIRMED RIGHT: 904/904 usage rows within the approved use scopes. RIGHTS UNKNOWN: 0. Rights/mapping gate cleared: 904/904. Full production approval remains 0 pending visual quality sign-off.
- Homepage gallery is MIXED. Use neutral application wording; authorship/project status is not confirmed per image.
- Prototype assets are approved presentation/design-system media, not SKU photos.
- Quality status for the 889 unique references is `OWNER REVIEW REQUIRED`. The selected production set is not yet recorded; review each selected unique reference once before production. This is a production-readiness requirement, not a Content Gate media blocker.

## Owner confirmations applied

### M1 — Product-gallery reuse rights

Owner authorizes the existing product-gallery source set on the new domain and in Supabase Storage, with responsive delivery, resize/crop, WebP/AVIF optimization, Catalog, Product Detail, Homepage, Open Graph/SEO previews and site marketing. This applies only to an image actually present in the confirmed source product/gallery. It records permission for the specified use, not a legal determination of underlying copyright ownership.

### M2 — Shared first images

The previously listed shared first-image assignments for accessories and Travertine are intentional. All 21 affected SKU may use the shared first image as a primary candidate. Keep the nine accessories and six Travertine pairs as separate SKU/product identities; do not merge or regenerate SKU.

### M3 — Product gallery mapping and roles

The gallery placed on each legacy product page is the intended media set for the associated registry SKU. Page UID/title match was verified against the catalog owner registry. Mapping is confirmed for all 808 gallery placements. Use the first product frame as `product_primary`, other product frames as `product_detail`, obvious macro as `texture_macro`, and obvious interiors as `interior_application`. Where role cannot be confidently identified, `unknown` is allowed; SKU mapping remains confirmed.

### M4 — Homepage gallery

The 60-image homepage gallery is MIXED: it may contain real work, visualizations and application/reference images. Customer-facing terms must be neutral: «Материал в интерьере», «Примеры применения», «В интерьере». Do not call an image «наш проект», «реализованный объект» or «работа Marmix Flex» without a separate per-image confirmation of authorship. Rights confirmation under M5 does not establish authorship.

### M5 — Homepage visual assets

Owner authorizes the confirmed 91-reference homepage source set on the new domain and in Supabase Storage, with resize/crop, optimization, responsive delivery, Homepage and appropriate SEO/OG use. This permission covers use in an appropriate homepage role; it does not assign a SKU or prove project authorship.

### M6 — Prototype/design-system assets

Retain `hero-room.webp`, `interior-room.webp`, `ivory-vein.webp`, `graphite-vein.webp` and `warm-strata.webp` in the approved visual-system roles. The room images are visualizations, not real Marmix Flex objects. Demo textures are presentation material only, not real product photography and not SKU-mapped. The manifest uses role `visualization/presentation` for these five assets.

### M7 — Owner quality review

Owner is responsible for visual review of color, texture accuracy, crop, resolution and production suitability. Keep `Quality status = OWNER REVIEW REQUIRED` until sign-off. Before production, review the unique assets selected for launch, deduplicated by source reference. No need to review repeated manifest rows separately. No quality sign-off has been recorded yet.

## Current gate assessment

| Gate | Status |
|---|---|
| Product-gallery rights and SKU mapping | PASS — 808/808 placements |
| Homepage rights and neutral mixed-gallery handling | PASS — 91/91 references |
| Prototype role/use | PASS — 5/5 presentation assets, no SKU mapping |
| Media blockers for Content Gate | 0 |
| Owner visual quality review before production | REQUIRED — selected unique launch assets; not a Content Gate blocker |
| Overall Content Gate | BLOCKED — 4 T008 product-commerce groups + T009 owner/legal sign-off |

## Historical pre-confirmation evidence

The prior inventory reported 808 product-gallery placements / 793 unique URLs; 21 shared first-image placements across seven groups; 557 non-primary product references; 8 filename/sample-based interior candidates on MF-MAR-0016 «Доминикана» and MF-MAR-0146 «Крема»; 60 homepage gallery slides and 31 other homepage references; and 5 prototype files. These counts and row-level URLs are retained in [MEDIA_MANIFEST.csv](MEDIA_MANIFEST.csv).

Before M1/M5/M6, right-to-use status was recorded as unknown because the repository contained no owner confirmation. Before M2/M3, shared-primary and gallery-mapping uncertainty was recorded. Before M4, project provenance was unresolved. Owner decisions above supersede those blocker statuses; they do not erase the historical evidence. The three old homepage sample slides remain sample observations only, not authorship evidence.


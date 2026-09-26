# Marmix Flex — Media Owner Decisions

**Проверено:** 2026-09-26.  
**T010:** DONE — manifest и проверяемый BLOCKED list готовы.  
**Content Gate:** BLOCKED. **T011 не начинать** до отдельного решения и закрытия gate.

## Inventory result

- 251/251 launch SKU сопоставлены с доступной source product page; у всех совпали legacy UID и название.
- 808 опубликованных product-gallery references / 793 уникальных CDN URL; 0 SKU без image reference.
- 230 unique first-gallery primary candidates; 21 SKU с неоднозначным shared primary в 7 URL groups.
- 60 homepage gallery references (3 sampled; 57 not individually reviewed) + 31 other homepage media references. Only the three reviewed homepage frames receive an interior/application role; the others remain unknown unless the source establishes a role.
- 5 approved-prototype files: 2 interior visualizations and 3 material-demo textures.
- OWNER CONFIRMED RIGHT: 0. RIGHTS UNKNOWN: all 904 manifest usage rows. Production approved: 0.
- Quality is separate: current assets are not individually quality-approved. The small sample review only identified likely interior/application scenes.

## Decision statuses

Use OWNER CONFIRMED RIGHT only with explicit owner/source evidence of permitted use. Otherwise keep RIGHTS UNKNOWN; if there is evidence of third-party material, use THIRD-PARTY / REVIEW REQUIRED. A visible Tilda/CDN URL is only SOURCE IMAGE. No status in this review is a legal ownership conclusion.

## Decisions Needed From Owner

### M1 — Rights for product-gallery photos

**Known:** 808 gallery placements / 793 unique URLs appear on the old Tilda product pages. No license, photographer/source record, or owner permission for transfer was found in project documents.  
**Need owner confirmation:** Who owns or licenses these files, and is reuse permitted on the new domain, in Supabase Storage, optimized/cropped derivatives, SEO previews and marketing?  
**Impact:** Until evidence/scope is confirmed, every product image remains RIGHTS UNKNOWN and must not be imported or published on the new site. Provide a blanket rights confirmation with source/evidence, or mark exceptions in the manifest.

### M2 — Shared first-image groups

**Known:** The Tilda page UID/title matches each SKU, but the same first image is used for multiple distinct SKU pages. A shared primary image is not an unambiguous SKU-specific candidate.

- Adhesive/coating family sharing one first image: MF-ACC-0001, 0002, 0003, 0005, 0006, 0007, 0008, 0009, 0011.
- Travertine shared first-image pairs: MF-TRV-0007 / 0003; 0004 / 0011; 0001 / 0006; 0012 / 0002; 0008 / 0009; 0010 / 0005.

**Need owner confirmation:** Are these shared image assignments intentional and visually valid for each product? If not, identify the correct source image per SKU or approve replacing them.  
**Impact:** Primary candidate remains unset for these 21 SKU; do not merge SKU identities.

### M3 — Remaining product-gallery roles and SKU correspondence

**Known:** All gallery entries are embedded under a product page whose UID/title match the registry. 557 non-primary references remain visually unclassified; 8 filenames suggest interior images under two SKU galleries. Page association alone does not prove that every image shows the named decor.  
**Need owner confirmation:** Can the source page gallery be treated as the intended image set for its SKU, subject to a visual pass? Mark only exceptions in the manifest. Confirm any image that is product_detail, texture_macro, or interior_application; leave unresolved images as unknown.  
**Impact:** Wrong decor visuals can misrepresent catalog identity even where the page linkage is exact.

### M4 — Existing homepage gallery provenance

**Known:** The old homepage has 60 slides in a section titled «Посмотрите какие работы мы выполняем». Only slides 1, 30 and 60 were visually sampled; they show interior/application or renovation contexts. The remaining 57 slides are not individually classified. No sampled image establishes that the object is a Marmix Flex customer project; a render, customer image or third-party source is also possible.  
**Need owner confirmation:** For this group, are these actual Marmix Flex installations, customer-supplied photos, visualizations, third-party references, or mixed? If mixed, mark exceptions by slide number in the manifest and provide attribution/permission where relevant.  
**Impact:** Until confirmed, do not call any slide «наш проект», «реализованный объект» or «работа Marmix Flex». Neutral application imagery still needs rights clearance.

### M5 — Rights to homepage visual assets

**Known:** The manifest lists 60 gallery images and 31 other unique homepage media references, including decorative/editorial assets and two filename-suggested material images without SKU mapping.  
**Need owner confirmation:** Confirm permitted reuse for this group in the new site, including resizing/cropping and public Storage delivery, or mark assets for replacement.  
**Impact:** All remain RIGHTS UNKNOWN and Production approved = NO until confirmed.

### M6 — Approved prototype assets

**Known:** hero-room.webp and interior-room.webp are captioned as visualizations; ivory-vein.webp, graphite-vein.webp, and warm-strata.webp are explicitly demo textures. They have no production SKU mapping and their provenance/rights are absent.  
**Need owner confirmation:** Is there documented permission/source provenance for any of the five files? If not, confirm they must be replaced before production.  
**Impact:** These files remain temporary visual references; they must not be imported as actual product/project media by default.

### M7 — Image quality and color accuracy

**Known:** Individual sharpness, resolution, crop, product-color fidelity, and production suitability have not been checked. This is separate from rights; a licensed image can still fail product-quality requirements.  
**Need owner confirmation:** Who can compare each selected product photo with the actual decor/sample, approve color fidelity and full-resolution original, and sign off the launch set?  
**Impact:** Do not mark Quality status = APPROVED or publish product photos as accurate material samples before that check.

## Explicit media BLOCKED list

1. Rights for current product, homepage and prototype images have no OWNER CONFIRMED RIGHT evidence.
2. 21 SKU primary assignments are ambiguous across 7 repeated first-image URL groups.
3. The remaining product gallery roles/content fidelity and per-image quality are not individually approved.
4. The 60-slide old-site “works” gallery has no confirmed authorship, project/render classification or use permission.
5. Prototype files are temporary demo/visualization assets; rights and production quality are unconfirmed.

These are grouped owner decisions (M1–M7), not one chat question per image. The row-level evidence and affected SKU references are in [MEDIA_MANIFEST.csv](MEDIA_MANIFEST.csv).

## Content Gate after T010

Overall Content Gate remains **BLOCKED**. T008 left four product-commerce blockers (flexible-board area for 14 SKU; fixed pricing for 20 range-price SKU; sale/price unit and quantity rules for 11 accessories; two groups of public-slug collisions). T009 left owner/legal confirmations for seller/contact identity, request effect, payment, delivery/pickup, returns/claims and privacy/consent. T010 now has its explicit media blocker list above. These blockers prevent T011; this document does not authorize T011.

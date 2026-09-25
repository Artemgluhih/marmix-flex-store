# Marmix Flex — Legal and Order Owner Decisions

**Review date:** 2026-09-25.  
**Task:** T009 — documentation complete; **T009 = DONE** under its acceptance criterion because unconfirmed fields are listed explicitly. This is not legal sign-off. **Content Gate = BLOCKED** pending T010, four unresolved commercial blockers from T008, and owner/legal decisions below. No frontend or legal page is approved by this document.

## Evidence status

| Status | Current result |
|---|---|
| OWNER CONFIRMED | New MVP takes an order request/inquiry; online payment is not approved. Customer accounts are unnecessary. Products without Admin-assigned `in_stock` or `on_order` stay visible but cannot enter order flow; validate server-side. |
| SOURCE FACT | Old site displays the Marmix Flex brand, phone strings `+7 (346) 299-96-76`, `+7 (982) 519-96-76`, and `+7 (3462) 99-96-76`; two addresses; a name/phone/city enquiry form, privacy link and consent checkbox; broad payment/delivery claims; and a post-submit contact statement. Source: [marmixflex.ru](https://marmixflex.ru/), checked 2026-09-25. Not owner-verified as current terms. |
| NEEDS OWNER CONFIRMATION | Legal seller/operator, current contact data, payment, delivery/pickup, returns/claims, request legal effect, and exact required checkout fields. |
| MISSING | Confirmed email, working hours, payment workflow, delivery geography/cost/terms, pickup rules, approved return/warranty process, complete current privacy/consent documents and legal requisites. |
| LEGAL REVIEW RECOMMENDED | Seller disclosures; distance-sale/request flow; return and claims wording; warranty/service-life claim; privacy notice, legal basis, consent and retention. |

## Decisions Needed From Owner

### L1 — Seller identity and legal requisites

**Known:** Public brand is Marmix Flex; project context is selling flexible marble in Surgut.  
**Need confirmation:** Legal seller name, legal form, INN/OGRN(IP) and public seller address/requisites; identity of the personal-data operator.  
**Owner options / expected answer:** Provide exact legal name, legal form, INN, OGRN/OGRNIP, address and which details may be public; identify data operator. If these are not yet available, state who will provide them and when.

### L2 — Public contacts and business hours

**Known:** Old site shows three phone strings with a formatting discrepancy, two addresses (Surgut and Moscow), and mentions Viber/WhatsApp. No confirmed email or hours.  
**Need confirmation:** Current inquiry phone, public address(es), whether either is pickup/claims location, active messenger, email and hours.  
**Owner options / expected answer:** Mark each displayed phone/address/channel KEEP or REMOVE; provide corrected phone format, active channel URLs/number, email and hours. State explicitly if no email/hours are to be shown.

### L3 — Meaning of submitting an order request

**Known:** Approved new-site scope is an inquiry/request flow without online payment. Old site says staff contact the customer after a request about payment/delivery.  
**Need confirmation:** Does submission only request a callback/quote, or does it create an order/offer/contract? Is a response-time promise intended?  
**Owner options / expected answer:** Select “inquiry only; no reservation or contract” or describe the actual binding step and when it occurs. Give any response-time target only if it is a service commitment.

### L4 — Payment workflow

**Known:** The old page makes a generic claim about payment methods but lists none. No online payment is approved for MVP.  
**Need confirmation:** Payment methods, when payment is due, prepayment/deposit, invoices, cash/non-cash, and whether terms differ for individuals/legal entities.  
**Owner options / expected answer:** Provide the actual methods and timing for each customer type, or confirm “discussed individually after request; no methods advertised online.” Confirm whether an invoice is available.

### L5 — Delivery and pickup

**Known:** Old page contains broad delivery claims and a free-delivery CTA, but no verifiable geography, price calculation or schedule. Listed addresses are not confirmed pickup points.  
**Need confirmation:** Whether delivery/pickup exists; covered locations; pricing/quote rule; estimated-time process; carrier/customer responsibilities.  
**Owner options / expected answer:** YES/NO for delivery and pickup. If YES, list exact service area, cost calculation and how timing is agreed. Confirm if either public address is a pickup point. No “across Russia”/free-delivery promise without explicit limits and approval.

### L6 — Returns, defects and claims

**Known:** No owner-confirmed process was found.  
**Need confirmation:** Contact and submission method for claims; process for goods of proper and defective quality; inspection/evidence steps; freight costs; warranty scope and any exceptions.  
**Owner options / expected answer:** Supply the existing approved policy or confirm that counsel should draft/review it. Do not choose “no returns” without legal advice. Provide the claims contact. **LEGAL REVIEW RECOMMENDED.**

### L7 — Checkout fields and personal-data minimization

**Known:** Architecture baseline is name + phone + cart lines, optional comment. Old form includes city; no business need for email is established.  
**Need confirmation:** Is city necessary to quote delivery? Is email needed for any real workflow? Is comment useful?  
**Owner options / expected answer:** Approve name/phone/cart/optional comment as minimum; answer YES/NO for city and email with the concrete operational need. No passport, date of birth, full home address or payment details by default.

### L8 — Privacy notice and processing purposes

**Known:** Old site links a privacy page and shows a consent checkbox, but the current text/operator was not verified. The form may collect name, phone, optional comment and possibly city, plus cart lines.  
**Need confirmation:** Data controller, purpose(s), legal basis for each purpose, processors/recipients, storage location, retention/deletion schedule, access/contact and withdrawal process.  
**Owner options / expected answer:** Provide current approved privacy documents and responsible legal contact, or authorize counsel to prepare them. Identify whether the form is used only to answer requests or also for marketing; marketing must not be silently bundled.

### L9 — Consent document and final legal copy

**Known:** The UI copy in CONTENT_FACTS.md is only a draft. Current 152-ФЗ Article 9 text states consent must be оформлено отдельно от иной информации/документов; implementation details require legal review.  
**Need confirmation:** Who signs off the standalone consent (if required), privacy notice, order/offer terms and checkbox wording; which version/date is approved.  
**Owner options / expected answer:** Name the reviewer and provide signed-off copy/document links, or explicitly assign preparation to counsel. Do not ship the draft as production legal text. **LEGAL REVIEW RECOMMENDED.**

## T009 blockers tracked for the Content Gate

1. Owner identity/contact confirmation (L1–L2).
2. Request legal effect and payment process (L3–L4).
3. Delivery/pickup terms (L5).
4. Returns/claims/warranty and contact (L6).
5. Checkout data purposes and approved privacy/consent documents (L7–L9).

Separately, four product-commerce blockers from T008 remain: flexible-board format for 14 SKUs; fixed-price rule for 20 range-priced SKUs; price/sale unit/minimum/step for 11 accessories; and two public-slug collision groups. T010 media rights remains unstarted. These do not make T009 documentation incomplete; they keep the overall Content Gate blocked.

## Safe wording drafts (not approved)

- Primary action: **«Отправить заявку»**.
- Optional action where a real staff quote follows: **«Запросить расчёт»**.
- Avoid **«Оплатить»**, guaranteed delivery/response, or “order confirmed” until the owner approves the workflow and counsel reviews relevant terms.

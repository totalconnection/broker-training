# Portal and Quote Workshop foundation

The portal landing page is `/app`. It shows only products the signed-in member can access. Academy is `/academy`. Quote Workshop is `/workshops/quote`, with process, lessons, calculator, and resources subpages. The legacy `/quote-calculator` route redirects to the workshop calculator. Existing quote-lesson links redirect to their workshop pages.

## Content and data

The workshop references the existing lessons `course-4-1` through `course-4-4` plus `course-9-11`. Content Studio remains the source of truth for videos, attached PDFs, publication state, and edits. Only published lessons and their PDFs are sent to students; administrators can preview drafts. No production content records are rewritten by this release. The process reference is available independently of video publication.

Lesson progress keeps the original lesson IDs. Quotes, branding, saved inputs, and outcomes keep their original member-owned storage. Academy includes workshop access, so existing active Academy members retain the quoting tools.

## Product access

`lib/products.ts` defines stable product IDs, independent of Stripe keys or account IDs. `product_enrollments` stores product-specific access, expiry, and revocation. Startup runs the additive schema migration before serving traffic. Existing active `enrollments` rows continue to grant Academy plus Quote Workshop. Administrators retain access to all products.

The default `requireMember()` guard requires Academy. The quotes API explicitly requires Quote Workshop. Lesson-progress and PDF endpoints authorize the particular lesson against the member's accessible course. Hiding a card or navigation item is not the authorization boundary.

For an existing account, an operator can run:

```
npm run product:access -- grant member@example.com quote-workshop 2027-10-25T23:59:59Z
npm run product:access -- revoke member@example.com quote-workshop
```

The date is an explicit access end date, not a permanent-access default. This script does not create accounts, send email, charge money, or revoke a separate Academy entitlement. Revoking a standalone workshop grant does not remove workshop access included through an active Academy enrollment.

## Next phases

This release does not configure checkout, products/prices in Stripe, webhooks, purchase emails, or a sales page. The later payment integration should map verified server-side Stripe prices to stable internal product IDs and update entitlements through idempotent fulfillment. A new Stripe account also needs its own prices, webhook configuration, and any customer/subscription migration plan; swapping a key alone is not an account migration. No Stripe secret is needed for this foundation.

## Validation

Automated checks cover existing/expired enrollment, standalone grants, revoked/unknown products, Academy inclusion, restricted lesson/media/resource projection, stable content IDs, and existing calculator math and quote ownership. Browser review checks portal navigation, quote creation, reopening, and outcome updates. Production media and downloads should be checked with an authenticated owner account after deployment.

## Storage recovery, October 25, 2026

The live service failed after sign-in because its copied S3 credentials had been invalidated by Railway. Service variables `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` were changed to references to the existing `lesson-pdfs` bucket. Keep these as references, not copied values. A saved, previously imported library no longer triggers another object-storage read on each visit. If the optional library cannot load before its first import, existing teaching and tools remain available and the UI shows a temporary availability notice. No stored lessons or files are removed.

## Drayage Workshop

`/workshops/drayage` is a separate product with workflow, lessons, calculator, and resources pages. Its stable entitlement is `drayage-workshop`; Academy includes it. A standalone purchase grants neither Academy nor Quote Workshop. Members with both workshops receive the union of their published lessons. Startup upgrades the existing product ID database constraint without replacing any grants.

The hub references `course-9-7`, `course-9-6`, `course-9-8`, `course-9-9`, and `course-9-10`, in that order. The three existing published masterclasses are available; the introduction and quoting/documentation recordings retain their draft status. Media, attachments, and progress remain under their original IDs. Legacy lesson URLs redirect to the hub. Content Studio remains authoritative. Workshop action prompts supplement blank lesson descriptions without rewriting stored content.

The drayage calculator starts and resets in Drayage mode, shows only drayage quotes in its tracker, and includes container/move details, deadlines, return instructions, carrier outreach drafts, and customer print output. Quotes and branding retain existing member-owned storage. API listing, loading, saving, and status changes enforce mode access: Drayage-only members can use only Drayage; existing Quote Workshop members retain all three modes. New fields default safely when opening older quotes. No live rate, terminal, or TMS feed is implied.

The resources page includes a printable container move checklist available immediately to members, plus any PDFs attached to their published lessons. Draft attachments remain admin-only. No additional recordings are published automatically. Access can be managed with `npm run product:access -- grant member@example.com drayage-workshop 2027-10-25T23:59:59Z`.

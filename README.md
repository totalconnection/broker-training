# Freight Skills · course portal shell

A working build preview for organizing recordings and designing the student experience. This is not a launched paid course. Stripe, live Lewis AI, automatic YouTube ingestion, and premium coaching delivery are intentionally deferred.

## Open locally

Use Node 24 or later.

```sh
npm ci
```

Create `.env.local` with:

```dotenv
DEMO_MODE=true
APP_URL=http://127.0.0.1:3000
```

```sh
npm run dev
```

Open http://127.0.0.1:3000/app for the student dashboard or http://127.0.0.1:3000/studio for the recording plan. Local review requires no account. It is limited to localhost and disabled on Railway. Keep this preview bound to localhost.

## Start with the content studio

1. Open **Content Studio**. It contains 52 proposed teaching units, including optional deep dives.
2. Filter **NEW** for 24 recordings to create. Open a lesson to see its production brief and assignment.
3. Review the 22 **REVISE** units and 6 **REUSE** candidates against your masterclasses, HighLevel training, and old course. Candidate mappings are editorial suggestions, not verified ready-to-publish clips.
4. Add a Vimeo URL and corresponding PDF. Save as a draft until reviewed, then mark published.
5. Export the recording plan as CSV for batching your production work.

Curriculum definitions live in `data/curriculum.json`; edit that file to change lesson titles, briefs, source mappings, and assignments. YouTube is not part of the lesson library. Its eventual use is as cited reference material for Lewis AI.

## What works in the shell

- Agent and brokerage-owner paths: 40 or 41 core units plus 8 optional deep dives.
- Dashboard, phase filtering, lesson pages, video and PDF slots, private local PDF uploads.
- Content studio with recording briefs, revision/reuse markers, publication controls, CSV export.
- Niche workbook, prospect tracker, margin calculator, practice document export.
- Saved playbook drafts, editing, deletion, and exports.
- One implemented practice check in lesson 5.3, with deterministic feedback. Other lessons have draft work areas, not completed assessments.
- Skool community link and an explicitly unfinished premium implementation area.

Lewis AI is labeled disconnected. No AI services are called. Rate confirmation and BOL examples are practice text exports, not operational document systems.

Local changes persist in `.local/`. This folder is ignored by Git; back it up if your review work matters. Local review is a single shared workspace on this computer, not multiple student accounts.

## Private course media

`private-media.json` is an optional, ignored local source map. It is not included in Git or the Docker image. Its format is:

```json
{"C001":{"title":"Existing course title","url":"YOUR_PRIVATE_VIMEO_URL"}}
```

Only the local admin preview loads it. Production lesson media must be entered through the studio after accounts and storage are configured. Configure Vimeo domain privacy for the final portal domain. PDF files should use private S3-compatible object storage; the included adapter supports Railway buckets and short-lived download links. No private URLs or PDFs belong in this repository.

## Railway preparation

A Dockerfile and `railway.json` are provided. Connect the GitHub repository to a Railway service when ready. `/api/health` is the deployment health endpoint. No Railway deployment has been created by this build.

The Docker build does not require database or auth secrets. Remote deployments default to a closed sign-in screen; the localhost preview bypass cannot be used on Railway. Do not set up real student access until the following production work is completed and tested:

- Railway PostgreSQL and the migrations in `scripts/`.
- Account configuration using `.env.example`, verified email delivery, and end-to-end enrollment/access tests. Authentication is disabled unless `AUTH_ENABLED=true`.
- Private bucket configuration and persistent production upload verification.
- Stripe purchase, webhook fulfillment, refunds/revocation, and the final access duration/pricing.
- Lesson content, rubrics, accessibility review, and account recovery testing.
- Lewis knowledge ingestion with citations, per-user quotas, and a global spending limit if AI is added.

The account and storage adapters are scaffolding, not a certification that these services have been deployed or tested. `member:create` grants access to an already-created account; it does not create users or send email.

## Checks

```sh
npm run typecheck
npm test
npm run build
```

Unit checks cover margin math, Vimeo URL validation/privacy hashes, the implemented exercise, curriculum path counts, and CSV formula escaping. Browser review covers the local shell; production integrations need separate testing when configured.

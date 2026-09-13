# Freight Skills teaching platform

## Review locally

- Student-facing dashboard: http://127.0.0.1:3000/app
- Admin content and roster: http://127.0.0.1:3000/studio
- Downloads: /resources
- GPT access: /gpt
- Skool access: /community

The new portal replaces the active workbench/playbook interface. The legacy components and data remain in the repository for reference but are not rendered by the portal page.

## Assemble the course

The seed follows the latest agreed lesson list: 29 common lessons, three owner lessons, and 11 optional reference lessons. Five lessons are marked for new recordings. Existing source IDs indicate candidates requiring editorial review, not publication approval.

Open Admin portal → Course content. Click a lesson to edit its title, section, summary, next action, duration, Vimeo link, PDF, and production reference. Add sections or lessons with the corresponding buttons. Use the arrow controls to reorder lessons within a section. Change the section in the editor to move a lesson. Save as draft or publish after a valid Vimeo link is attached. Unpublish by clearing the publication checkbox.

Videos are uploaded to Vimeo; this portal stores the link. PDFs can be uploaded directly (15 MB maximum), replaced, or detached. Student downloads require active enrollment and a published lesson in their permitted path. Students see neither drafts nor production source references. Progress is student-reported completion, not verified video watch time or a competency assessment.

## Persistence and access

Local demo uses .local/workspace.json and .local/uploads. Production uses the existing PostgreSQL workspace_items table for course configuration and lesson_progress records, with private S3-compatible PDF storage and short-lived signed download links. Apply the existing database migration before running production. Local content/files are not automatically transferred to production; back them up and migrate them when preparing Railway.

The roster reads real enrolled non-admin users and their lesson completions, path, access status, and latest lesson activity. Local demo explicitly shows only the local preview account; there are no invented student records.

## Connect services before launch

1. Configure Railway PostgreSQL, authentication secret/base URL, verified-email delivery, and run npm run db:migrate. Disable DEMO_MODE in production. Use the existing member:create script for manual enrollment until checkout automation exists.
2. Configure a private S3-compatible bucket using the S3 variables in .env.example. Test upload/download against the live bucket.
3. In Admin → Settings, set the existing Freightskills GPT URL and confirm the Skool community URL. GPT currently opens externally in a new tab; it is not embedded native chat and does not automatically synchronize course or YouTube material.
4. Add a checkout URL later. This only displays an enrollment link to signed-in users without access. Stripe payment verification, webhooks, access grants/revocation, and purchase onboarding remain deferred.
5. Upload reviewed teaching and PDFs, verify Vimeo domain/privacy settings for the production domain, and publish the ready lessons.

## Validation

TypeScript check, production build, and nine automated tests pass. Added tests cover draft/role filtering, safe connection URLs, publication prerequisites, unique identifiers, and completion deduplication. Local browser checks cover dashboard navigation, editor save/reload persistence, completion/next lesson, and roster rendering. Production database, email, S3, Vimeo playback, and GPT account access need live credentials and have not been end-to-end verified.

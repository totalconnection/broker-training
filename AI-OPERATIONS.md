# Freightskills GPT operations

Native /gpt replaces the old outbound GPT link. The model is fixed to gpt-4.1-mini-2025-04-14. No browsing, attachments, tools, retries, or model selection are offered. Each question is standalone.

## Private knowledge

The public GitHub repository must never contain data/knowledge. The library is stored as knowledge/library.json in the portal's existing private Railway bucket. It currently contains 99 transcript sources plus the owner-approved objection example. No claim is made that all source text is current or privacy-reviewed. Owners can search all sources. Students search only approved sources. Source review and approval are available to administrators on /gpt. Publishing a lesson does not automatically approve its transcript. Vimeo links and PDFs are not automatically transcribed or indexed. New knowledge requires updating the private library; a self-service import workflow is not implemented yet.

The initial retrieval engine searches bounded transcript passages by terms. It does not yet use semantic embeddings. Relevant passages are supplied to the model with role-aware teaching instructions. Source references link to applicable published lessons when available. A source with no matching live lesson remains a title reference.

## Enablement

OPENAI_API_KEY must exist on the broker-training production service. AI_ENABLED must be exactly true. Missing keys or a disabled flag fail closed. AI_MONTHLY_BUDGET_USD defaults to 50; malformed or negative values disable paid requests through a zero budget. The API key is server-only. Local demo does not make paid calls.

## Cost controls

PostgreSQL serializes request reservations across all instances. Each request reserves 30,000 microdollars ($0.03) before calling OpenAI. Reservations are intentionally not refunded; successful actual token cost is tracked separately. This conservative allocation avoids relying on provider billing delays or retry assumptions. Failed/uncertain requests retain their reservation. Input text is capped at 30,000 UTF-8 bytes; output at 1,500 tokens. At verified standard model rates ($0.40/M input, $1.60/M output), the reservation covers this bounded text-only request with overhead margin. Recheck rates before changing models or prices.

Limits: 100 paid requests per user per UTC calendar month, 10 per UTC day, one pending request per user for up to two minutes, and a 45-second provider timeout. A stale pending request remains charged against the budget. Requests with no matching teaching return a fallback without calling the model. All admins also count against usage limits. This budget covers this endpoint's model requests only, not unrelated API use, storage, hosting, or separately authorized evaluation runs.

## Validation

Tests exercise source retrieval, default unapproved archive, unknown-topic fallback, quota boundaries, busy-request rejection and reservation arithmetic. Full concurrency testing against production PostgreSQL and authenticated end-to-end checks remain pending permitted access. Live model evaluation requires the configured OpenAI key and uses scripts/evaluate-gpt.ts. Before public launch, Luis should review a broader 30–50 question evaluation set. The first three live checks are a smoke test, not a complete quality evaluation.

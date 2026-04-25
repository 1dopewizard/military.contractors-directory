# Open Defense Contractor Intelligence Pivot Plan

## Summary

Reposition `military.contractors` as an open intelligence layer for U.S. defense contractors: company profiles, public award data, agencies, NAICS/PSC categories, spending trends, and structured follow-up exploration.

## Product Thesis

The product should answer plain-English questions about the public defense industrial base and back every answer with structured data. It is not a job board, a MOS translation tool, or a veteran placement funnel.

Primary promise:

> Open intelligence on U.S. defense contractors.

## Key Changes

- Update product docs and public copy around contractor intelligence, public awards, agencies, categories, and spending trends.
- Keep the directory foundation: `/companies`, `/companies/[slug]`, specialties, locations, contractor APIs, sitemap, auth/admin scaffolding, and claimed-profile infrastructure.
- Remove MOS/job alert positioning from README, PRD, homepage, about, footer/nav copy, and sitemap inputs.
- Remove public job, MOS, alert, OCONUS, and ad/recruiting surfaces from active routes and components.
- Upgrade company profiles from career-oriented pages to intelligence profiles with identifiers, aliases, public award context, agencies, NAICS/PSC categories, spending trend, and USAspending links.
- Add an explorer experience where users ask questions about contractors, awards, agencies, locations, NAICS/PSC, and spending.
- Never present generated narrative without backing structured records, filters, and source links.

## Data Foundation

Add a USAspending/SAM-oriented schema layer:

- `recipientEntity`: normalized recipient identity, UEI, CAGE, aliases, linked contractor.
- `award`: award-level public contract records.
- `awardTransaction`: transaction/obligation history reserved for deeper award detail.
- `agency`: agency reference data.
- `naicsCode`: NAICS reference data.
- `pscCode`: PSC reference data.
- `explorerQueryCache`: normalized query plan, result JSON, generated summary, source metadata, refresh timestamp.

Keep existing `contractor`, `specialty`, and `contractorLocation`; extend rather than replace them.

## Backend Operations

Deterministic operations own totals, rankings, filtering, pagination, attribution, and freshness:

- Explorer planning and filter extraction.
- USAspending award search and category rankings.
- Contractor profiles over the last five fiscal years.
- Agency, topic, NAICS, PSC, and ranking page rollups.
- Follow-up refine, pivot, and answer workflows from structured cached results.

## Public API

- `GET /api/intelligence/contractors/[slug]`
- `GET /api/intelligence/top-contractors`
- `GET /api/intelligence/recipients/resolve`
- `GET /api/intelligence/awards`
- `GET /api/intelligence/awards/[awardKey]`
- `GET /api/intelligence/agencies`
- `GET /api/intelligence/agencies/[agencySlug]`
- `GET /api/intelligence/categories/[kind]/[code]`
- `GET /api/intelligence/topics/[topicSlug]`
- `GET /api/intelligence/rankings/[presetSlug]`
- `POST /api/explorer/query`
- `POST /api/explorer/follow-up`
- `GET /api/explorer/cache/[cacheId]`

## AI Rules

- Query plans must validate against strict zod schemas.
- Deterministic planners classify intent, extract filters, and map plain English to structured categories by default.
- LLMs may summarize or propose follow-ups only from structured rows when configured.
- The backend owns numerical calculations, ranked results, pagination, source attribution, and cache freshness.
- Explorer results must show structured filters, source metadata, ranked tables/cards, and source links.

## Phases

### Phase 1: Reposition

- Add this plan document.
- Update README, PRD, homepage, about, navigation, and sitemap away from MOS/job-first positioning.
- Remove MOS/job insight pages from primary navigation and sitemap inputs.

### Phase 2: Intelligence Data Foundation

- Add Drizzle schema and migrations for public award intelligence.
- Create deterministic intelligence operations and USAspending-shaped return types.
- Seed an MVP contractor set: Lockheed Martin, RTX, Northrop Grumman, Boeing, General Dynamics, Leidos, Booz Allen, CACI, Anduril, Palantir.

### Phase 3: Company Profiles

- Add contract intelligence panels to `/companies/[slug]`.
- Show recent awards, yearly obligations, top agencies, top NAICS/PSC, identifiers, aliases, and source links.
- Preserve specialty, location, revenue, and claimed-profile infrastructure as profile context.

### Phase 4: Explorer MVP

- Implement strict query planning and deterministic operation routing.
- Support company lookup, company comparison, agency top contractors, category search, location search, and award keyword search.
- Cache structured results and summaries.

### Phase 5: SEO And Durable Pages

- Generate indexable pages for top contractors, agencies, NAICS, PSC, locations, and major contractor profiles.
- Add Organization, WebPage, BreadcrumbList, and Dataset schema where appropriate.
- Keep USAspending/SAM source links prominent.

## Test Plan

- Unit tests for planner schema acceptance/rejection, query planning, and aggregation math.
- API tests for stable contractor intelligence shapes and explorer cache reuse.
- UI tests for homepage explorer and company intelligence sections.
- Verification commands: `pnpm test:run`, `pnpm build`, `pnpm db:generate`, `pnpm db:migrate` against local development data.

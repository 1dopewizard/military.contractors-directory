# Defense Contractor Database MVP Plan

## Summary

Focus `military.contractors` on a simple, source-backed database of companies and recipients that received U.S. Department of Defense contract awards in the trailing 36 months.

## Product Thesis

The MVP should make the public DoD contractor recipient universe easy to search, sort, filter, inspect, and verify. AI analyst workflows, community features, feeds, watchlists, exports, alerts, and monetization are deferred until the database itself is complete and trusted.

Primary promise:

> The searchable database of companies receiving U.S. Department of Defense contract awards.

## Key Changes

- Position `/` as the database homepage, not an AI analyst or news-feed surface.
- Keep the directory foundation: `/`, `/companies/[slug]`, contractor APIs, sitemap, auth/admin scaffolding, and refresh tooling.
- Keep rankings, agencies, categories, topics, and compare as secondary database views when they are source-backed and easy to verify.
- Remove public explorer, analyst workbench, feed, watchlist, briefing, and community positioning from active UI and docs.
- Never present narrative as a substitute for structured records, source links, filters, and freshness metadata.

## Data Foundation

The canonical broad dataset is `contractorSnapshot`: one row per USAspending recipient in the active trailing 36-month DoD-awarded contract window.

Supporting profile intelligence may cache award-level records and rollups for profile/ranking pages:

- `recipientEntity`: normalized recipient identity, UEI, CAGE, aliases, linked contractor.
- `award`: award-level public contract records.
- `awardTransaction`: transaction/obligation history reserved for deeper award detail.
- `agency`: agency reference data.
- `naicsCode`: NAICS reference data.
- `pscCode`: PSC reference data.
- `explorerQueryCache`: legacy cache table used for profile, ranking, and page responses. Public explorer surfaces are not part of the MVP.

## Backend Operations

Deterministic operations own totals, rankings, filtering, pagination, attribution, and freshness:

- USAspending recipient snapshot refresh.
- Contractor profile refreshes over recent public awards.
- Agency, topic, NAICS, PSC, and ranking page rollups.
- Source metadata and cache freshness display.

## Public API

Core MVP APIs:

- `GET /api/contractors`
- `GET /api/contractors/[slug]`
- `GET /api/search`
- `POST /api/admin/contractor-snapshot/refresh`

Secondary database-view APIs may remain when source-backed:

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

## Deferred

- AI analyst workbench.
- Feed or Hacker News-style discovery surface.
- Watchlists, alerts, saved lists, and exports.
- Briefing generation.
- Public comments, voting, or community features.
- RFP matching and monetization.

## Phases

### Phase 1: Database MVP Shell

- Update README, PRD, homepage, about, navigation, and sitemap copy around the database-first product.
- Remove `/explorer` from public routes, navigation, global search, sitemap, and admin tools.
- Keep source-backed contractor profiles and database views.

### Phase 2: Completeness and Freshness

- Harden snapshot refresh reliability.
- Improve source/freshness metadata visibility.
- Ensure every matching DoD recipient in the trailing 36 months is included without a dollar threshold.

### Phase 3: Profile Quality

- Improve recipient/company profile evidence: recent awards, top agencies, NAICS/PSC, identifiers, aliases, and USAspending links.
- Preserve curated overlays only as enrichment.

### Phase 4: SEO and Durable Database Pages

- Generate indexable pages for major recipients, agencies, NAICS, PSC, locations, and rankings.
- Keep USAspending source links prominent.

## Test Plan

- Unit tests for USAspending filter construction, snapshot normalization, and aggregation math.
- API tests for stable contractor/search/ranking shapes and cache reuse.
- UI tests for homepage table, profile evidence, loading, empty, and error states.
- Verification commands: `pnpm test:run`, `pnpm build`, `pnpm db:generate`, `pnpm db:migrate` against local development data.

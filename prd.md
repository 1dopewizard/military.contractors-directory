# Product Requirements Document: military.contractors

## 1. Summary

**Current v1 promise:** the searchable directory of companies receiving U.S. Department of Defense contract awards.

`military.contractors` is a directory-first product built around a daily USAspending recipient snapshot. The core workflow is:

1. Search or filter canonical Department of Defense contractor profiles active in the trailing 36 months.
2. Open a contractor profile.
3. Verify obligations, awards, identifiers, agencies, NAICS, PSC, alternate USAspending recipient names, and source links against public USAspending records.

The MVP focuses on making the contractor directory complete, fast, source-backed, and easy to verify before adding analyst, feed, watchlist, or community layers.

The long-term direction is broader: make `military.contractors` the public intelligence layer for the defense industrial base after the canonical directory foundation is complete, fresh, and source-backed.

## 2. Source Of Truth

| Item                  | Decision                                             |
| --------------------- | ---------------------------------------------------- |
| Data source           | USAspending.gov API                                  |
| Awarding agency scope | Department of Defense only                           |
| Award type scope      | Contract award codes `A`, `B`, `C`, `D`              |
| Time window           | Trailing 36 months                                   |
| Row inclusion         | All matching recipients, no minimum dollar threshold |
| Refresh               | Daily recipient snapshot                             |
| Database              | libSQL/SQLite via Drizzle                            |
| UI table              | shadcn-vue Table + TanStack Vue Table                |

Curated `contractor` rows are enrichment overlays only. Raw USAspending rows remain preserved in `contractorSnapshot`; public directory/search results are derived into canonical `contractorDirectoryGroup` rows and source-backed `contractorDirectoryAlias` rows.

## 3. Goals

- Make `/` the concise directory homepage with search, stats, and table preview.
- Make `/companies` the canonical verified directory and data trust surface.
- Provide source-backed canonical contractor profiles from `/companies/[slug]`.
- Support server-side search, filtering, sorting, and pagination over canonical groups and aliases.
- Keep rankings and agency pages as secondary database lenses; topics, comparisons, claims, teaming, and institutional access are deferred from primary public positioning.
- Preserve existing curated company context without merging raw USAspending recipients into curated contractor rows.
- Avoid fuzzy name-only merges; group only by shared identifiers or explicit curated mappings.
- Establish a durable foundation for post-v1 contractor intelligence, claimed profile context, teaming discovery, and institutional access.

## 4. Strategic Roadmap Beyond V1

The product should evolve in layers. Each layer depends on preserving the credibility of the source-backed database.

### Phase 1: Directory foundation

Complete the current MVP: comprehensive DoD contractor coverage, canonical grouped results, visible alternate USAspending recipient names, source-backed profiles, stable search/filter/sort/page behavior, source freshness, and durable SEO surfaces.

### Phase 2: Profile intelligence

Improve profile-level award context with richer trends, identifiers, related entities, agencies, NAICS, PSC, recent awards, and explainable rollups. This remains descriptive intelligence, not scoring.

### Phase 3: Transparent intelligence signals

Introduce source-linked indicators that help users interpret contractor activity. Initial signal candidates include:

- competition exposure
- agency concentration
- NAICS/PSC concentration
- award trend direction
- year-end award concentration
- source freshness and data completeness

Signals must show their calculation window, inputs, source links, and limitations. Do not launch public A-F grades until the signal methodology, entity resolution, and correction workflow are mature enough to support them.

### Phase 4: Claimed and verified profile context

Allow contractors to claim profiles, add capabilities, add public business-development context, and submit correction requests. Claimed context must be visibly separate from USAspending-sourced facts and curated editorial overlays.

### Phase 5: Teaming discovery

Use profile intelligence, public award activity, categories, geography, and claimed capabilities to help primes and small businesses discover potential teaming partners. Start with discovery and alerts before marketplace transactions or messaging.

### Phase 6: Institutional data products

Package trusted profile intelligence, signal histories, bulk exports, custom reports, and monitoring workflows for analysts, investors, consultants, journalists, and government/oversight users. Paid access should expand workflow depth, collaboration, alerts, exports, and institutional reporting; it must not sell factual corrections, public-data suppression, score improvement, or paid ranking placement.

See `docs/contractor-intelligence-signals.md` for initial signal methodology and `docs/premium-institutional-access-plan.md` for monetization boundaries.

## 5. Non-Goals

- No SAM.gov enrichment in v1.
- No parent-company normalization in v1.
- No saved lists, exports, alerts, watchlists, RFP matching, analyst workbench, AI feed, community, monetization, claimed profile workflow, teaming marketplace, or institutional access in v1.
- No public A-F contractor grades in the initial signal rollout.
- No paid correction of source-backed public facts.
- No paid score improvement or pay-to-rank behavior.
- No local full award warehouse requirement for MVP.
- No minimum dollar threshold.

## 6. Data Model

### `contractorSnapshot`

One row per USAspending recipient in the active trailing 36-month DoD-awarded window.

Required fields:

- `slug`
- `recipientName`
- `normalizedName`
- `recipientUei`
- `recipientCode`
- `totalObligations36m`
- `awardCount36m`
- `lastAwardDate`
- `topAwardingAgency`
- `topAwardingSubagency`
- `topNaicsCode`
- `topNaicsTitle`
- `topPscCode`
- `topPscTitle`
- `sourceUrl`
- `sourceMetadata`
- `rawAggregate`
- `snapshotWindowStart`
- `snapshotWindowEnd`
- `refreshedAt`

The USAspending recipient category endpoint does not provide every top-category field in the aggregate response. Those fields may be null after the broad snapshot and can be filled opportunistically from award-level profile refreshes.

### `contractorDirectoryGroup`

One row per public canonical contractor result derived from `contractorSnapshot`.

Required fields:

- `slug`
- `canonicalName`
- `primarySnapshotId`
- `primaryRecipientUei`
- `primaryRecipientCode`
- aggregate `totalObligations36m` and `awardCount36m`
- `lastAwardDate`
- top agency, NAICS, and PSC fields from the canonical source row
- `aliasCount`
- source and freshness metadata

Grouping is conservative: shared UEI/recipient code or explicit curated mappings. Similar names without shared identifiers or curated mapping stay separate.

### `contractorDirectoryAlias`

One row per raw USAspending snapshot row attached to a canonical directory group. Alias rows keep the source snapshot ID, raw recipient name, slug, identifiers, obligations, award count, source URL, and match reason so alternate USAspending names are visible on profile pages.

### `contractorSnapshotRun`

Tracks refresh execution:

- `status`: `running`, `completed`, `failed`, `partial`
- `windowStart`
- `windowEnd`
- `startedAt`
- `completedAt`
- `pageCount`
- `rowCount`
- `error`
- `sourceMetadata`

## 7. Refresh Workflow

The refresh service:

1. Computes the trailing 36-month date window.
2. Builds USAspending filters:
   - `award_type_codes`: `A-D`
   - `agencies`: DoD as awarding toptier
   - `time_period`: trailing 36 months
3. Pages through `/api/v2/search/spending_by_category/recipient/`.
4. Normalizes each recipient row into a stable snapshot row.
5. Upserts raw recipient rows by slug without replacing the raw `contractorSnapshot` table.
6. Deletes stale raw rows only after a completed refresh.
7. Rebuilds canonical `contractorDirectoryGroup` and `contractorDirectoryAlias` rows from the preserved raw snapshot rows.
8. Records run status, page counts, row counts, group counts, source metadata, errors, and completion time.

Refresh can run through:

- Nitro scheduled task `contractor-snapshot-refresh`
- Manual endpoint `POST /api/admin/contractor-snapshot/refresh`

## 8. Profile Loading Architecture

Public profile pages must not block on live USAspending calls. The page loads in two layers:

1. `GET /api/contractors/[slug]` returns the local profile shell from `contractorSnapshot` and curated overlays only.
2. `GET /api/contractors/[slug]/intelligence` returns cached award-level intelligence and starts a background refresh when the cache is stale or missing.

The intelligence endpoint uses stale-while-revalidate semantics:

- fresh cache returns immediately as `ready`
- stale cache returns immediately as `stale` and refreshes in the background
- missing cache returns `refreshing` or `unavailable` without blocking the profile shell
- admin/manual refresh paths may force live refreshes, but ordinary public page loads should not pay USAspending latency

This keeps the first profile click fast while preserving source-backed detail once the local cache is warm.

## 9. Public APIs

### `GET /api/contractors`

Query params:

- `q`
- `agency`
- `naics`
- `psc`
- `sort`
- `order`
- `limit`
- `offset`

Default sort: `totalObligations36m desc`.

Max limit: `100`.

Response:

```ts
{
  rows: ContractorSnapshotRow[] // canonical groups with alias counts
  total: number // group count, not raw alias count
  limit: number
  offset: number
  sourceMetadata: SourceMetadata
}
```

### `GET /api/contractors/[slug]`

Returns the fast local profile shell:

- canonical directory group
- raw primary snapshot row
- `directoryAliases` with alternate USAspending names, identifiers, metrics, and source URLs
- curated contractor overlay where available
- source links and snapshot metadata
- `intelligence: null`
- `intelligenceStatus: "separate_endpoint"`

Canonical and alias slugs resolve to the same canonical profile response.

This endpoint must not call USAspending live.

### `GET /api/contractors/[slug]/intelligence`

Returns cached award-level intelligence plus refresh state:

- `status`: `ready`, `stale`, `refreshing`, or `unavailable`
- `intelligence`: cached contractor intelligence or `null`
- `refreshedAt`
- `expiresAt`
- `refreshQueued`
- `warnings`

This endpoint may enqueue a background refresh when the cache is stale or missing, but it should not block the response on USAspending.

## 10. Pages

### `/`

Directory homepage:

- searchable directory product promise
- compact search entry point
- key stats and source freshness
- verified directory/table preview
- link into `/companies` for full search/filter/sort/pagination

### `/companies`

Primary product surface:

- dense server-backed canonical contractor table
- server-side search/filter/sort/page over canonical names, alternate names, UEI, and recipient codes
- row click to `/companies/[slug]`
- source freshness metadata
- empty/loading/error states

### `/companies/[slug]`

Profile:

- canonical contractor identity and identifiers
- obligations and award counts
- alternate USAspending recipient names with identifiers, obligations, award counts, and source links
- recent awards
- top agencies, NAICS, PSC
- transparent signal panels when signal data is available
- source links
- curated company context where available

### Deferred public workflows

Topics, comparisons, claimed profile workflows, teaming discovery, exports, alerts, and institutional access remain deferred from the primary v1 product surface until the canonical directory is complete and trusted.

## 11. SEO/AEO

- Homepage and `/companies` target "defense contractor directory", "DoD contractor database", and "defense contract recipients".
- Company pages use recipient/company name in the title.
- Sitemap prioritizes `/`, `/companies`, and canonical contractor profile URLs.
- Alias profile URLs are not emitted as duplicate sitemap entries.
- Structured data search action targets `/companies?q={search_term_string}`.

## 12. Testing

Required coverage:

- USAspending filter construction for trailing 36 months, DoD-awarded only, and award types `A-D`.
- Snapshot normalization for slugs, names, UEI/code handling, null top categories, and obligation sorting.
- Canonical grouping for shared identifiers, curated aliases, aggregate totals, alias lookup, and similar-name non-merge edge cases.
- `/api/contractors` behavior for ordering, alias search, filters, pagination, invalid params, and empty states.
- Refresh service behavior for successful pages, retry, partial failure, and run metadata.
- Table states for loading, empty, populated, filtering, sorting, pagination, and row navigation.

Verification commands:

```bash
pnpm test:run
pnpm format:check
pnpm db:generate
pnpm db:migrate
```

# Product Requirements Document: military.contractors

## 1. Summary

**Primary promise:** the searchable directory of companies receiving U.S. defense contract awards.

`military.contractors` is a directory-first product built around a daily USAspending recipient snapshot. The core workflow is:

1. Search or filter Department of Defense-awarded contract recipients active in the trailing 36 months.
2. Open a recipient/company profile.
3. Verify obligations, awards, agencies, NAICS, PSC, recent awards, and source links.

The existing explorer remains available, but it is secondary to the directory/profile loop.

## 2. Source Of Truth

| Item | Decision |
| --- | --- |
| Data source | USAspending.gov API |
| Awarding agency scope | Department of Defense only |
| Award type scope | Contract award codes `A`, `B`, `C`, `D` |
| Time window | Trailing 36 months |
| Row inclusion | All matching recipients, no minimum dollar threshold |
| Refresh | Daily recipient snapshot |
| Database | libSQL/SQLite via Drizzle |
| UI table | shadcn-vue Table + TanStack Vue Table |

Curated `contractor` rows are enrichment overlays only. The canonical broad directory dataset is `contractorSnapshot`.

## 3. Goals

- Make `/companies` the primary product surface.
- Make `/` a directory-first landing surface with search, stats, and a table preview.
- Provide source-backed recipient profiles from `/companies/[slug]`.
- Support server-side search, filtering, sorting, and pagination.
- Keep explorer, rankings, topics, agencies, categories, and compare pages as secondary research tools.
- Preserve existing curated company context without merging raw USAspending recipients into curated contractor rows.

## 4. Non-Goals

- No SAM.gov enrichment in v1.
- No parent-company normalization in v1.
- No saved lists, exports, alerts, RFP matching, or monetization in v1.
- No local full award warehouse requirement for MVP.
- No minimum dollar threshold.

## 5. Data Model

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

## 6. Refresh Workflow

The refresh service:

1. Computes the trailing 36-month date window.
2. Builds USAspending filters:
   - `award_type_codes`: `A-D`
   - `agencies`: DoD as awarding toptier
   - `time_period`: trailing 36 months
3. Pages through `/api/v2/search/spending_by_category/recipient/`.
4. Normalizes each recipient row into a stable snapshot row.
5. Upserts rows by slug.
6. Records run status, page counts, row counts, source metadata, errors, and completion time.
7. Deletes stale rows only after a completed refresh.

Refresh can run through:

- Nitro scheduled task `contractor-snapshot-refresh`
- Manual endpoint `POST /api/admin/contractor-snapshot/refresh`

## 7. Public APIs

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
  rows: ContractorSnapshotRow[]
  total: number
  limit: number
  offset: number
  sourceMetadata: SourceMetadata
}
```

### `GET /api/contractors/[slug]`

Returns:

- snapshot row
- curated contractor overlay where available
- on-demand USAspending profile intelligence
- recent awards
- trend
- agency buckets
- NAICS buckets
- PSC buckets
- source links and source metadata

## 8. Pages

### `/`

Directory-first homepage:

- product promise headline
- compact search
- key stats
- table preview
- secondary research links

### `/companies`

Primary product surface:

- dense server-backed table
- server-side search/filter/sort/page
- row click to `/companies/[slug]`
- source freshness metadata
- empty/loading/error states

### `/companies/[slug]`

Profile:

- recipient identity and identifiers
- obligations and award counts
- recent awards
- top agencies, NAICS, PSC
- source links
- curated company context where available

## 9. SEO/AEO

- Homepage and `/companies` target "defense contractor directory" and "defense contract recipients".
- Company pages use recipient/company name in the title.
- Sitemap prioritizes `/` and `/companies`.
- Snapshot profile URLs are included in the sitemap.
- Structured data search action targets `/companies?q={search_term_string}`.

## 10. Testing

Required coverage:

- USAspending filter construction for trailing 36 months, DoD-awarded only, and award types `A-D`.
- Snapshot normalization for slugs, names, UEI/code handling, null top categories, and obligation sorting.
- `/api/contractors` behavior for ordering, search, filters, pagination, invalid params, and empty states.
- Refresh service behavior for successful pages, retry, partial failure, and run metadata.
- Table states for loading, empty, populated, filtering, sorting, pagination, and row navigation.

Verification commands:

```bash
pnpm test:run
pnpm build
pnpm db:generate
pnpm db:migrate
```

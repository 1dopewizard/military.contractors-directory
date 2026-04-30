# military.contractors

Searchable directory of companies and recipients receiving U.S. defense contract awards.

## Product

`military.contractors` is now directory-first. The primary product surface is a fast server-backed table of Department of Defense-awarded USAspending contract recipients active in the trailing 36 months. Recipient rows link to source-backed profiles with recent awards, agency buckets, NAICS buckets, PSC buckets, trends, and public USAspending links.

The explorer, rankings, agencies, categories, topics, and compare pages remain available as secondary research surfaces.

## Data Scope

| Dimension | v1 Default |
| --- | --- |
| Source | USAspending.gov API |
| Awarding agency | Department of Defense only |
| Award types | Contract award codes `A`, `B`, `C`, `D` |
| Window | Trailing 36 months |
| Inclusion | Every matching recipient, no dollar threshold |
| Refresh | Daily scheduled snapshot plus manual admin refresh |
| Storage | libSQL/SQLite via Drizzle ORM |

Curated `contractor` records are retained as enrichment overlays for known companies. Raw USAspending recipient rows live in `contractorSnapshot` and are the canonical directory dataset.

## Pages

| URL | Purpose |
| --- | --- |
| `/` | Directory-first homepage with search, stats, and table preview |
| `/companies` | Primary server-side table with search, filters, sorting, pagination |
| `/companies/[slug]` | Snapshot profile with award intelligence and curated overlay where available |
| `/explorer` | Secondary plain-English research workbench |
| `/rankings/[presetSlug]` | Saved ranking lenses |
| `/agencies`, `/agencies/[agencySlug]` | Agency research surfaces |
| `/categories/[kind]/[code]` | NAICS/PSC research surfaces |
| `/topics/[topicSlug]` | Topic research surfaces |
| `/compare` | Known-contractor comparison |
| `/admin` | Admin tools, including snapshot refresh |

## API

### `GET /api/contractors`

Snapshot-backed directory query.

Query params:

- `q`
- `agency`
- `naics`
- `psc`
- `sort`: `totalObligations36m`, `awardCount36m`, `lastAwardDate`, `recipientName`, `topAwardingAgency`, `topNaics`, `topPsc`
- `order`: `asc` or `desc`
- `limit`: default `25`, max `100`
- `offset`

Response:

```json
{
  "rows": [],
  "total": 0,
  "limit": 25,
  "offset": 0,
  "sourceMetadata": {}
}
```

### `GET /api/contractors/[slug]`

Returns the snapshot row, optional curated company overlay, and on-demand USAspending profile intelligence.

### `POST /api/admin/contractor-snapshot/refresh`

Manually refreshes the trailing 36-month DoD recipient snapshot.

Optional body:

```json
{
  "limit": 100,
  "maxPages": 1000
}
```

## Data Refresh

Daily Nitro task:

```ts
nitro: {
  experimental: { tasks: true },
  scheduledTasks: {
    "15 7 * * *": ["contractor-snapshot-refresh"]
  }
}
```

Manual refresh:

```bash
curl -X POST http://localhost:3000/api/admin/contractor-snapshot/refresh \
  -H 'content-type: application/json' \
  --data '{"limit":100,"maxPages":10}'
```

Database commands:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:studio
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Nuxt 4 |
| UI | shadcn-vue, Tailwind CSS, TanStack Vue Table |
| Database | libSQL/SQLite via Drizzle ORM |
| Auth | Better Auth |
| Search | SQLite filters for snapshot rows; USAspending API for source refresh |
| Testing | Vitest |

## Development

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

Verification:

```bash
pnpm test:run
pnpm build
```

## Key Paths

| Purpose | Path |
| --- | --- |
| Snapshot schema | `server/database/schema/snapshot.ts` |
| Snapshot service | `server/utils/contractor-snapshot.ts` |
| Directory API | `server/api/contractors/index.get.ts` |
| Profile API | `server/api/contractors/[slug].get.ts` |
| Manual refresh API | `server/api/admin/contractor-snapshot/refresh.post.ts` |
| Scheduled task | `server/tasks/contractor-snapshot-refresh.ts` |
| Table component | `app/components/Contractors/ContractorSnapshotTable.vue` |
| Primary page | `app/pages/companies/index.vue` |

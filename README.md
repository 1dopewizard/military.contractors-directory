# military.contractors

Searchable directory of companies receiving U.S. Department of Defense contract awards.

## Product

`military.contractors` is directory-first. The primary product surface is a fast server-backed table of Department of Defense contractors active in the trailing 36 months, sourced from USAspending.gov. Public results are grouped conservatively so one canonical contractor profile is listed while alternate USAspending recipient names remain visible on the detail page with identifiers, obligations, award counts, and source links.

Rankings and agency views remain secondary database lenses. Topics, comparisons, claimed profiles, teaming discovery, and institutional workflows are deferred until the directory foundation is complete and trusted.

## Product Direction

The current v1 product is the searchable, source-backed contractor directory. The long-term product direction is a public intelligence layer for the defense industrial base after the directory foundation is stable:

1. **Directory foundation** - complete, fresh, source-linked DoD contractor coverage with canonical groups and visible alternate USAspending recipient names.
2. **Profile intelligence** - richer profile context, trends, identifiers, categories, and relationship evidence.
3. **Transparent signals** - explainable indicators such as competition exposure, agency concentration, award trend, category concentration, and source freshness. These are not A-F grades in the initial rollout.
4. **Claimed profiles** - contractor-provided capabilities and correction requests that remain visibly separate from public USAspending facts.
5. **Teaming discovery** - discovery workflows that help primes and small businesses find relevant partners using public activity and verified profile context.
6. **Institutional access** - bulk data, monitoring, exports, and reports for analysts, investors, journalists, consultants, and oversight users.

Future commercial features must preserve source-backed trust: public award facts cannot be pay-to-edit, corrections are not a paid product, and visibility cannot mean paid score improvement.

See `docs/plans/2026-05-10-001-feat-contractor-intelligence-roadmap-plan.md`, `docs/contractor-intelligence-signals.md`, and `docs/premium-institutional-access-plan.md` for the phased roadmap and methodology constraints.

## Data Scope

| Dimension       | v1 Default                                         |
| --------------- | -------------------------------------------------- |
| Source          | USAspending.gov API                                |
| Awarding agency | Department of Defense only                         |
| Award types     | Contract award codes `A`, `B`, `C`, `D`            |
| Window          | Trailing 36 months                                 |
| Inclusion       | Every matching recipient, no dollar threshold      |
| Refresh         | Daily scheduled snapshot plus manual admin refresh |
| Storage         | libSQL/SQLite via Drizzle ORM                      |

Curated `contractor` records are retained as enrichment overlays for known companies. Raw USAspending recipient rows remain preserved in `contractorSnapshot`; public directory results are derived into `contractorDirectoryGroup` and `contractorDirectoryAlias` without fuzzy name-only merges.

## Pages

| URL                                   | Purpose                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------ |
| `/`                                   | Directory homepage with search, stats, and table preview                 |
| `/companies`                          | Canonical contractor directory with search, filters, sorting, pagination |
| `/companies/[slug]`                   | Canonical contractor profile with alternate USAspending names            |
| `/rankings/[presetSlug]`              | Secondary saved ranking lenses                                           |
| `/agencies`, `/agencies/[agencySlug]` | Secondary agency research surfaces                                       |
| `/admin`                              | Admin tools, including snapshot refresh                                  |

Deferred routes and workflows such as topics, comparisons, claims, corrections, teaming discovery, and institutional access may remain in code but are not the primary public v1 product surface.

## API

### `GET /api/contractors`

Canonical grouped directory query.

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

Returns the fast local profile shell from the canonical directory group plus optional curated company overlay. Alias slugs resolve to the canonical profile and include `directoryAliases`. This endpoint does not call USAspending live; `intelligence` is returned as `null` and detailed award intelligence is loaded separately.

### `GET /api/contractors/[slug]/intelligence`

Returns cached award-level intelligence using stale-while-revalidate behavior.

Response:

```json
{
  "status": "ready",
  "intelligence": null,
  "refreshedAt": null,
  "expiresAt": null,
  "refreshQueued": false,
  "warnings": []
}
```

Statuses:

- `ready` - fresh cached intelligence returned
- `stale` - stale cached intelligence returned while a background refresh is queued
- `refreshing` - no cached intelligence is available yet and a background refresh is queued or running
- `unavailable` - no cached intelligence is available

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

| Layer     | Technology                                                                           |
| --------- | ------------------------------------------------------------------------------------ |
| Framework | Nuxt 4                                                                               |
| UI        | shadcn-vue, Tailwind CSS, TanStack Vue Table                                         |
| Database  | libSQL/SQLite via Drizzle ORM                                                        |
| Auth      | Better Auth                                                                          |
| Search    | SQLite filters over canonical groups and aliases; USAspending API for source refresh |
| Testing   | Vitest                                                                               |

## Development

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

Verification:

```bash
pnpm test:run
pnpm format:check
```

## Key Paths

| Purpose                  | Path                                                                     |
| ------------------------ | ------------------------------------------------------------------------ |
| Snapshot schema          | `server/database/schema/snapshot.ts`                                     |
| Snapshot service         | `server/utils/contractor-snapshot.ts`                                    |
| Directory API            | `server/api/contractors/index.get.ts`                                    |
| Profile API              | `server/api/contractors/[slug].get.ts`                                   |
| Profile intelligence API | `server/api/contractors/[slug]/intelligence.get.ts`                      |
| Intelligence logic       | `server/utils/intelligence.ts`                                           |
| Manual refresh API       | `server/api/admin/contractor-snapshot/refresh.post.ts`                   |
| Scheduled task           | `server/tasks/contractor-snapshot-refresh.ts`                            |
| Table component          | `app/components/Contractors/ContractorSnapshotTable.vue`                 |
| Front page               | `app/pages/index.vue`                                                    |
| Companies directory page | `app/pages/companies/index.vue`                                          |
| Product roadmap          | `docs/plans/2026-05-10-001-feat-contractor-intelligence-roadmap-plan.md` |
| Signal methodology       | `docs/contractor-intelligence-signals.md`                                |
| Premium access plan      | `docs/premium-institutional-access-plan.md`                              |

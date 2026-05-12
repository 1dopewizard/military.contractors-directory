---
title: refactor: Simplify to directory-first foundation
type: refactor
status: active
date: 2026-05-12
---

# refactor: Simplify to directory-first foundation

## Overview

Simplify `military.contractors` around the practical v1: a fast, source-backed directory of Department of Defense contract recipients active in the trailing 36 months from USAspending.gov.

The directory should show one main public result per contractor/entity. If USAspending exposes multiple similar recipient names for the same contractor, the directory lists the canonical/main name once and shows the alternate USAspending recipient names on the detail page.

---

## Problem Frame

The current application already has a strong USAspending-backed snapshot foundation, but it also exposes or documents several later-stage ideas: intelligence signals, teaming discovery, claims, corrections, institutional access, topics, comparisons, and richer research surfaces. Those may be useful later, but they distract from the clearest product wedge.

The first durable product should be simpler:

1. Search/filter the active DoD contractor universe.
2. Open a source-backed profile.
3. Verify obligations, award counts, identifiers, recent awards, agencies, NAICS, PSC, source links, freshness, and alternate recipient names.

This refactor preserves raw USAspending facts while introducing a canonical directory layer for public results.

---

## Requirements Trace

- R1. Public v1 positioning is a simple DoD contractor directory sourced from USAspending.gov.
- R2. The active directory window remains trailing 36 months, DoD-awarded contracts, award type codes `A`, `B`, `C`, `D`.
- R3. Raw USAspending recipient snapshot rows remain preserved and regenerable.
- R4. Public directory/search results return one canonical main contractor row when multiple USAspending names represent the same contractor.
- R5. Alternate USAspending recipient names are visible on the canonical detail page with source-backed identifiers and metrics.
- R6. Entity grouping is conservative: curated alias mappings and shared identifiers before any name-only matching.
- R7. Similar names without shared identifiers or curated mapping must not be merged automatically.
- R8. Deferred features are hidden or de-emphasized from primary public navigation until the directory is solid.
- R9. SEO and sitemap output favor `/companies` and canonical contractor profile URLs.
- R10. Tests cover grouping, alias lookup, aggregate totals, and non-merge edge cases.

---

## Scope Boundaries

- Do not delete intentional future-feature code unless explicitly approved.
- Do not introduce fuzzy automatic entity resolution in v1.
- Do not require SAM.gov enrichment, parent-company normalization, paid workflows, or claimed-profile workflows for the directory foundation.
- Do not remove raw `contractorSnapshot` rows; grouped directory output must sit on top of the raw source-backed snapshot.
- Do not turn source-backed signals or scoring into a public v1 dependency.

### Deferred to Follow-Up Work

- Parent-company hierarchy and sophisticated entity resolution.
- Human admin tooling for merge/split review.
- Public signal panels as a primary product promise.
- Teaming discovery, watchlists, exports, alerts, claimed profiles, and premium/institutional access.
- Full sitemap strategy for topics/categories/rankings after the directory foundation is proven.

---

## Context & Research

### Relevant Code and Patterns

- `server/database/schema/snapshot.ts` stores raw USAspending recipient snapshot rows.
- `server/utils/contractor-snapshot.ts` owns snapshot refresh, query parsing, list responses, profile lookup, and profile intelligence shell behavior.
- `server/api/contractors/index.get.ts` delegates list queries to `queryContractorSnapshots`.
- `server/api/search.get.ts` maps contractor snapshot results into global search results.
- `server/api/contractors/[slug].get.ts` loads one snapshot row plus curated overlay for the detail page.
- `app/components/Contractors/ContractorSnapshotTable.vue` renders the server-backed directory table.
- `app/pages/index.vue` is already directory-first and can remain the homepage.
- `app/pages/companies/[slug].vue` already has an identity section with linked recipients/aliases that can be adapted for canonical groups.
- `app/components/GlobalSearch.vue` still promotes some non-directory quick links.
- `server/api/__sitemap__/urls.get.ts` emits snapshot profile URLs and secondary database views.

### Institutional Learnings

- `docs/open-contractor-intelligence-pivot-plan.md` already recommends prioritizing source links, freshness, and database completeness before analyst, community, or monetization layers.
- `README.md` and `prd.md` currently describe the directory foundation but still give substantial space to later-stage intelligence and monetization.

### External References

- USAspending `/api/v2/search/spending_by_category/recipient/` returns recipient grouped results with `amount`, `recipient_id`, `name`, `code`, `uei`, and pagination metadata.
- USAspending `/api/v2/search/spending_by_award/` supports recipient fields including `Recipient Name`, `Recipient UEI`, and `recipient_id` for detail enrichment.

---

## Key Technical Decisions

- Keep raw snapshot rows as source truth: The grouped directory should be derived from `contractorSnapshot`, not replace it.
- Add a canonical grouping layer: This keeps public output clean while preserving source rows for auditability and future split/merge review.
- Use conservative merge keys: Prefer curated aliases and shared identifiers. Avoid automatic fuzzy merges of similar legal names.
- Resolve alias slugs to canonical profiles: Users and search engines should land on the main profile, with aliases shown as source-backed context.
- Hide rather than delete future product surfaces initially: This reduces public scope without destroying work that may become useful after the directory is solid.

---

## Open Questions

### Resolved During Planning

- Should similar-but-different contractor names appear as separate directory results? No. If they represent the same contractor/entity, list the main name once and show alternate names on the detail page.
- Should all similar names be auto-merged? No. Use strict identifiers and curated aliases first; do not fuzzy-merge name-only matches in v1.
- Should future intelligence/teaming work be deleted? No. Hide or de-emphasize first unless deletion is explicitly approved.

### Deferred to Implementation

- Whether the grouped directory layer is implemented as new tables or a derived view/query helper depends on the smallest reliable implementation path.
- Exact migration names and generated Drizzle metadata are determined during schema implementation.
- Whether alias slugs redirect with HTTP 301/302 or render canonical content with canonical meta can be decided during routing implementation.

---

## Implementation Units

- [ ] U1. **Recenter public scope**

**Goal:** Make the active product documentation, navigation, and sitemap clearly directory-first.

**Requirements:** R1, R2, R8, R9

**Dependencies:** None

**Files:**

- Modify: `README.md`
- Modify: `prd.md`
- Modify: `docs/open-contractor-intelligence-pivot-plan.md`
- Modify: `app/layouts/homepage.vue`
- Modify: `app/pages/index.vue`
- Modify: `app/components/GlobalSearch.vue`
- Modify: `server/api/__sitemap__/urls.get.ts`

**Approach:**

- Keep `/` and `/companies` as primary directory surfaces.
- Remove primary navigation to secondary/future surfaces.
- Keep future features documented as deferred, not live product promises.
- Prefer canonical directory/profile pages in sitemap output.

**Patterns to follow:**

- Current concise directory copy in `app/pages/index.vue` and `app/pages/about.vue`.
- Current dynamic sitemap shape in `server/api/__sitemap__/urls.get.ts`.

**Test scenarios:**

- Test expectation: mostly documentation/navigation/SEO changes. Verify with code review and existing app checks.

**Verification:**

- Header/nav and global search promote directory-first flows.
- Public docs state that directory completion is the v1 priority.
- Sitemap does not prioritize alias or deferred feature pages over canonical directory/profile pages.

---

- [ ] U2. **Add canonical directory grouping**

**Goal:** Derive canonical contractor groups from raw USAspending snapshot rows while preserving raw rows.

**Requirements:** R3, R4, R5, R6, R7, R10

**Dependencies:** U1

**Files:**

- Modify: `server/database/schema/snapshot.ts`
- Create: `server/database/migrations/*_contractor_directory_groups.sql`
- Modify: `server/utils/contractor-snapshot.ts`
- Test: `tests/server/utils/contractor-snapshot-groups.test.ts`

**Approach:**

- Add a grouped directory representation, preferably `contractorDirectoryGroup` and `contractorDirectoryAlias` tables.
- Store canonical slug/name, aggregate totals, latest award date, top categories, source metadata, and alias rows.
- Build grouping from curated aliases and stable identifiers first: UEI, recipient code/DUNS, recipient ID.
- Preserve raw `contractorSnapshot` rows unchanged.

**Patterns to follow:**

- Drizzle schema style in `server/database/schema/snapshot.ts`.
- Existing normalization and snapshot refresh helpers in `server/utils/contractor-snapshot.ts`.

**Test scenarios:**

- Happy path: Two snapshot rows with the same UEI but different names produce one canonical group.
- Happy path: Aggregated obligations and award counts equal the sum across grouped aliases.
- Edge case: Two similar names with different identifiers produce two groups.
- Edge case: Missing identifiers fall back to a self-contained single-row group unless curated alias data says otherwise.
- Integration: Refresh/upsert path can rebuild groups after raw snapshot rows change.

**Verification:**

- Raw snapshot rows remain queryable.
- Group rows are deterministic and source-backed.
- Alias rows identify the source snapshot rows and alternate names.

---

- [ ] U3. **Switch list and search APIs to canonical groups**

**Goal:** Return canonical groups from public directory/search APIs while preserving existing response compatibility where practical.

**Requirements:** R4, R6, R7, R10

**Dependencies:** U2

**Files:**

- Modify: `server/utils/contractor-snapshot.ts`
- Modify: `server/api/contractors/index.get.ts`
- Modify: `server/api/search.get.ts`
- Test: `tests/server/utils/contractor-snapshot-groups.test.ts`

**Approach:**

- Update public query helpers to operate on canonical groups.
- Include alias fields/search matching so searching an alternate recipient name returns the canonical contractor row.
- Keep response fields needed by `ContractorSnapshotTable.vue`: slug, recipientName/name, obligations, award count, last award date, top agency, NAICS, PSC, source URL, freshness.

**Patterns to follow:**

- Current `queryContractorSnapshots` response shape.
- Current global search mapper in `server/api/search.get.ts`.

**Test scenarios:**

- Happy path: `/api/contractors` style helper returns one canonical row for grouped aliases.
- Happy path: Searching by alias name returns the canonical row.
- Edge case: Pagination total counts groups, not aliases.
- Edge case: Sorting by obligations uses grouped aggregate obligations.

**Verification:**

- Directory table no longer shows duplicate recipient-name variants for the same entity.
- Existing UI fields remain populated.

---

- [ ] U4. **Resolve canonical and alias profile slugs**

**Goal:** Make contractor detail pages load the canonical group and show alternate USAspending names.

**Requirements:** R4, R5, R6, R7, R9, R10

**Dependencies:** U2, U3

**Files:**

- Modify: `server/api/contractors/[slug].get.ts`
- Modify: `server/api/contractors/[slug]/intelligence.get.ts`
- Modify: `server/utils/contractor-snapshot.ts`
- Modify: `app/pages/companies/[slug].vue`
- Test: `tests/server/utils/contractor-snapshot-groups.test.ts`

**Approach:**

- Add lookup helpers that resolve either canonical slug or alias slug to the canonical group.
- Return alternate recipient names/aliases in the detail response.
- Keep canonical slug available for SEO canonical URLs and table links.
- Use grouped alias names/identifiers to improve `linkedRecipients` display.

**Patterns to follow:**

- Existing detail response composition in `server/api/contractors/[slug].get.ts`.
- Existing identity section in `app/pages/companies/[slug].vue`.

**Test scenarios:**

- Happy path: Canonical slug returns canonical detail response and alias list.
- Happy path: Alias slug resolves to the canonical profile.
- Edge case: Unknown slug still returns 404.
- Integration: Detail response includes enough alias data for UI without forcing live USAspending calls.

**Verification:**

- Detail page displays main name as title.
- Detail page lists alternate USAspending recipient names with identifiers/metrics.
- Alias pages do not create duplicate canonical sitemap entries.

---

- [ ] U5. **Add canonical `/companies` directory page and UI polish**

**Goal:** Make `/companies` the clear canonical directory page and adapt UI copy to canonical contractor groups.

**Requirements:** R1, R4, R5, R8, R9

**Dependencies:** U3, U4

**Files:**

- Create: `app/pages/companies/index.vue`
- Modify: `app/components/Contractors/ContractorSnapshotTable.vue`
- Modify: `app/components/GlobalSearch.vue`
- Modify: `app/pages/index.vue`
- Modify: `app/pages/companies/[slug].vue`

**Approach:**

- Reuse `ContractorSnapshotTable` for `/companies`.
- Update table labels/copy from raw recipients to active contractors where appropriate.
- Keep alias counts or secondary text if returned by the API.
- Route global search “view all” to `/companies?q=...`.

**Patterns to follow:**

- Existing `app/pages/index.vue` directory composition.
- Existing `DirectoryPageHeader`, `DirectoryBreadcrumb`, and `DirectoryStatRibbon` usage.

**Test scenarios:**

- Happy path: `/companies` renders directory table and SEO metadata.
- Happy path: Searching from global command palette routes to `/companies?q=<query>`.
- Edge case: Empty table state explains snapshot refresh instead of missing product data.

**Verification:**

- `/companies` is useful as a standalone canonical directory page.
- Homepage remains concise and routes deeper directory use to `/companies`.

---

- [ ] U6. **Validate and simplify**

**Goal:** Confirm grouping, API, UI, and docs work together without overbuilding future product layers.

**Requirements:** R1-R10

**Dependencies:** U1-U5

**Files:**

- Modify as needed based on validation.
- Test: `tests/server/utils/contractor-snapshot-groups.test.ts`
- Test: affected existing tests under `tests/server/` and `tests/app/`

**Approach:**

- Run targeted tests for new grouping behavior.
- Run the project check command required by repo rules after code changes.
- Review diff for YAGNI and remove unnecessary future-feature promotion.

**Patterns to follow:**

- Existing Vitest coverage style in `tests/server/utils/intelligence.test.ts`.
- Repo rule: after code changes, run `npm run check` if available; this repo currently exposes `pnpm test:run` and format scripts, so use available project validation and report any missing script explicitly.

**Test scenarios:**

- Integration: Grouped directory API and profile API support one canonical result with visible aliases.
- Regression: Existing intelligence/profile tests still pass or are updated to the new canonical behavior.

**Verification:**

- Tests pass.
- No public nav/copy contradicts the directory-first scope.
- No accidental deletion of future-feature code without explicit approval.

---

## System-Wide Impact

- **Interaction graph:** Snapshot refresh now feeds grouped directory output before public list/search/profile responses.
- **Error propagation:** If grouping fails during refresh, raw snapshot data should remain intact and errors should surface through run/source metadata where practical.
- **State lifecycle risks:** Regenerating groups must avoid stale alias rows pointing at deleted raw snapshot rows.
- **API surface parity:** `/api/contractors`, `/api/search`, profile detail, sitemap, and UI table should all agree on canonical slugs/names.
- **Integration coverage:** Grouping must be tested at helper level and verified through API-shaped responses.
- **Unchanged invariants:** The USAspending source window, DoD awarding agency filter, and award type code filter remain unchanged.

---

## Risks & Dependencies

| Risk                                   | Mitigation                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------- |
| False contractor merges                | Use curated aliases and shared identifiers first; avoid fuzzy name-only matching.     |
| Duplicate indexed pages                | Emit canonical group slugs in sitemap and include canonical URL metadata on profiles. |
| Migration/regeneration complexity      | Preserve raw snapshot rows and make grouped data rebuildable.                         |
| Scope creep into intelligence platform | Hide/de-emphasize deferred features, but do not require them for directory v1.        |
| UI response mismatch                   | Keep list response compatibility fields and update table types deliberately.          |

---

## Documentation / Operational Notes

- Update docs to state directory-first v1 clearly.
- Add operational notes if group tables need backfill/rebuild after migrations.
- If future-feature routes remain available but hidden, note that they are not primary public product surfaces.

---

## Sources & References

- Related plan: `docs/open-contractor-intelligence-pivot-plan.md`
- Related docs: `README.md`, `prd.md`, `docs/contractor-intelligence-signals.md`, `docs/premium-institutional-access-plan.md`
- Related code: `server/utils/contractor-snapshot.ts`, `server/database/schema/snapshot.ts`, `app/components/Contractors/ContractorSnapshotTable.vue`, `app/pages/companies/[slug].vue`
- USAspending recipient category API: `https://github.com/fedspendingtransparency/usaspending-api/blob/master/usaspending_api/api_contracts/contracts/v2/search/spending_by_category/recipient.md`
- USAspending award search API: `https://github.com/fedspendingtransparency/usaspending-api/blob/master/usaspending_api/api_contracts/contracts/v2/search/spending_by_award.md`

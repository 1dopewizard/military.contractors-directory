---
title: feat: Evolve contractor intelligence roadmap
type: feat
status: active
date: 2026-05-10
---

# feat: Evolve contractor intelligence roadmap

## Overview

`military.contractors` should keep the current database-first MVP while documenting the longer-term product arc: source-backed contractor profiles become transparent contractor intelligence signals, claimed profile context, teaming discovery, and institutional data products.

The near-term implementation is documentation-only. It aligns `prd.md`, `README.md`, and this roadmap without changing schema, APIs, UI, billing, or access control.

---

## Problem Frame

The current product is a searchable database of Department of Defense-awarded USAspending contract recipients. That foundation is necessary, but the strategic opportunity is broader: become the public intelligence layer for the defense industrial base.

The product should not jump directly to public A-F grades or a marketplace. Public procurement data is messy, and misleading judgments would erode trust. The safer path is to compound credibility in phases:

1. Complete, source-backed directory coverage.
2. Explainable profile intelligence and methodology.
3. Transparent signal indicators instead of reductive grades.
4. Contractor-managed context and correction workflows.
5. Teaming discovery based on public activity and declared capabilities.
6. Institutional data/reporting products for high-intent users.

---

## Requirements Trace

- R1. Preserve the current v1 database MVP as the active product scope.
- R2. Document a post-v1 roadmap from database to contractor intelligence platform.
- R3. Describe scorecards as transparent source-linked signals, not A-F grades in the initial rollout.
- R4. Separate public/source-backed data from contractor-provided claimed profile context.
- R5. Position teaming discovery as a later workflow that builds on profile intelligence and claimed context.
- R6. Keep monetization language strategic and future-facing, not presented as currently implemented.
- R7. Update `prd.md` and `README.md` so future contributors understand the product direction.

---

## Scope Boundaries

- No schema changes in this pass.
- No API changes in this pass.
- No UI/page implementation in this pass.
- No A-F contractor grades in the first signal phase.
- No paid ranking, paid score improvement, or pay-to-correct public source data.
- No live marketplace, messaging, lead routing, billing, or institutional export implementation in this pass.

### Deferred to Follow-Up Work

- Signal methodology design and validation.
- Persistent score/signal snapshot storage.
- Public profile signal panels.
- Claimed profile verification and admin review.
- Correction/dispute workflows.
- Teaming discovery search and outreach workflows.
- Premium/institutional access controls and data exports.

---

## Context & Research

### Relevant Code and Patterns

- `prd.md` currently defines the active database-first MVP and v1 non-goals.
- `README.md` documents current pages, APIs, data refresh, tech stack, and key paths.
- `docs/open-contractor-intelligence-pivot-plan.md` already establishes the database-first pivot and defers monetization/community layers.
- `docs/database-schema.md` notes claimed profile management conceptually, while active schema files show no dedicated claim/correction/marketplace tables yet.
- `server/database/schema/snapshot.ts` stores the broad USAspending recipient snapshot.
- `server/database/schema/intelligence.ts` stores normalized recipients, awards, transactions, and persistent intelligence cache.
- `server/api/contractors/index.get.ts` and `server/api/contractors/[slug].get.ts` expose the current snapshot/profile contract.
- `app/pages/index.vue`, `app/pages/about.vue`, and `app/pages/companies/[slug].vue` already use source-backed database/profile positioning.
- `tests/server/utils/intelligence.test.ts` contains the current deterministic helper coverage pattern.

### Institutional Learnings

- The existing `docs/open-contractor-intelligence-pivot-plan.md` prioritizes trust, source links, freshness, and database completeness before analyst, community, or monetization layers.

### External References

- No external research used for this documentation pass. The plan is based on current repo state and product strategy from the user conversation.

---

## Key Technical Decisions

- Keep v1 database-first: The directory is the foundation for SEO, trust, profile traffic, and later commercial workflows.
- Introduce signals before grades: Transparent indicators are easier to explain, correct, and defend than a single public letter grade.
- Make methodology source-linked: Every future signal should show inputs, calculation window, caveats, and USAspending source links.
- Separate data provenance: Public award data, curated editorial overlays, and contractor-submitted profile context must remain visibly distinct.
- Treat teaming as post-signal workflow: Teaming discovery depends on credible company profiles and declared capabilities, so it should not be the first monetized feature.
- Treat monetization as layered: Claimed profiles, lead/teaming workflows, and institutional exports should build on the same trusted data model rather than create separate products.

---

## Open Questions

### Resolved During Planning

- Should the product jump directly to public A-F scorecards? No. Start with transparent intelligence signals and defer aggregate grades until methodology, data quality, and correction workflows are mature.
- Should the teaming marketplace be separate from scorecards? No. Treat teaming discovery as a downstream workflow powered by profile intelligence, claimed capabilities, and relationship/activity data.
- Should this pass implement the roadmap? No. This pass updates strategy documentation only.

### Deferred to Implementation

- Which exact signals ship first: Depends on feasibility analysis against available USAspending fields and transaction history.
- Whether signal snapshots need new tables or can initially be computed/cached from existing intelligence data: Decide during signal implementation.
- Claim verification policy: Requires product/admin workflow decisions before schema/API work.
- Billing/access model: Requires business validation before implementation.

---

## Implementation Units

- [x] U1. **Align product documentation**

**Goal:** Update active docs so the current MVP and future roadmap are both clear.

**Requirements:** R1, R2, R6, R7

**Dependencies:** None

**Files:**

- Modify: `prd.md`
- Modify: `README.md`
- Create: `docs/plans/2026-05-10-001-feat-contractor-intelligence-roadmap-plan.md`

**Approach:**

- Keep the existing database-first promise as v1.
- Add future roadmap sections without implying future features are currently live.
- Point readers to phased evolution from database to intelligence platform.

**Patterns to follow:**

- `docs/open-contractor-intelligence-pivot-plan.md` for database-first sequencing.
- Existing concise Markdown structure in `prd.md` and `README.md`.

**Test scenarios:**

- Test expectation: none -- documentation-only change with no runtime behavior.

**Verification:**

- `prd.md` includes a clear future roadmap while preserving v1 non-goals.
- `README.md` includes product direction without changing current API/page accuracy.
- This plan exists under `docs/plans/`.

---

- [x] U2. **Design signal methodology**

**Goal:** Define explainable contractor intelligence signals that can be computed from public data.

**Requirements:** R2, R3, R4

**Dependencies:** U1

**Files:**

- Create: `docs/contractor-intelligence-signals.md`
- Modify: `prd.md`
- Test: `tests/server/utils/intelligence.test.ts`

**Approach:**

- Start with non-punitive indicators such as competition exposure, agency concentration, award trend, NAICS/PSC concentration, year-end award concentration, and source freshness.
- For each signal, document inputs, windows, interpretation, limitations, and source links.
- Avoid aggregate letter grades until signal-level quality is proven.

**Patterns to follow:**

- Existing deterministic USAspending helper tests in `tests/server/utils/intelligence.test.ts`.
- Existing source metadata handling in `server/utils/contractor-snapshot.ts` and `server/utils/intelligence.ts`.

**Test scenarios:**

- Happy path: Given awards across multiple agencies, signal generation reports lower concentration than a single-agency contractor.
- Happy path: Given mostly competitive awards, competition exposure presents as favorable/healthy without assigning a letter grade.
- Edge case: Given missing optional NAICS/PSC data, signal output marks the signal unavailable instead of fabricating an interpretation.
- Error path: Given stale or failed USAspending refresh metadata, freshness signal reflects degraded confidence.

**Verification:**

- Each signal has a documented formula or interpretation rule.
- Tests cover deterministic signal calculations and missing-data behavior.

---

- [x] U3. **Add signal data contract**

**Goal:** Expose signal data through the contractor profile API without breaking existing profile consumers.

**Requirements:** R2, R3, R4

**Dependencies:** U2

**Files:**

- Modify: `server/utils/contractor-snapshot.ts`
- Modify: `server/utils/intelligence.ts`
- Modify: `server/api/contractors/[slug].get.ts`
- Modify: `app/types/intelligence.types.ts`
- Test: `tests/server/utils/intelligence.test.ts`

**Approach:**

- Add a structured `signals` collection to contractor intelligence/profile responses.
- Include signal key, label, status, explanation, source fields, confidence/caveats, and calculation window.
- Preserve existing response fields for current pages.

**Patterns to follow:**

- Existing `ContractorIntelligence` response structure.
- Existing `sourceMetadata` warning/freshness model.

**Test scenarios:**

- Happy path: Profile response includes signals for a contractor with sufficient award data.
- Edge case: Profile response omits or marks unavailable a signal when required inputs are absent.
- Integration: `GET /api/contractors/[slug]` preserves existing profile fields while adding signal data.

**Verification:**

- Existing profile pages still load with prior fields.
- Signal data is structured enough for UI rendering and future storage.

---

- [x] U4. **Render public signal panels**

**Goal:** Add profile UI sections that make signals readable, source-backed, and non-defamatory.

**Requirements:** R2, R3, R4

**Dependencies:** U3

**Files:**

- Modify: `app/pages/companies/[slug].vue`
- Create: `app/components/Contractors/ContractorSignalPanel.vue`
- Test: `app/components/Contractors/ContractorSignalPanel.spec.ts`

**Approach:**

- Display signal indicators as descriptive cards or rows, not grades.
- Show caveats, calculation windows, and source/freshness context.
- Keep public source data visually separate from contractor-submitted or curated context.

**Patterns to follow:**

- Existing contractor profile layout in `app/pages/companies/[slug].vue`.
- Existing shadcn-vue/Tailwind component patterns.

**Test scenarios:**

- Happy path: Multiple available signals render with labels, statuses, and explanations.
- Edge case: Unavailable signal renders a neutral unavailable state with reason.
- Error path: Warnings from source metadata are visible and do not appear as definitive judgments.

**Verification:**

- Profile UI remains source-first and avoids A-F or punitive score language.
- Signal panels are mobile responsive and match existing visual patterns.

---

- [x] U5. **Add claimed profile and correction workflow**

**Goal:** Let contractors provide context and request corrections without modifying public source-backed facts directly.

**Requirements:** R4, R5, R6

**Dependencies:** U3

**Files:**

- Modify: `server/database/schema/directory.ts`
- Modify: `server/database/schema/admin.ts`
- Create: `server/api/profile-claims/index.post.ts`
- Create: `server/api/profile-corrections/index.post.ts`
- Modify: `app/pages/contact.vue`
- Test: `tests/server/profile-claims.test.ts`

**Approach:**

- Store claim/correction submissions separately from source-backed snapshot facts.
- Include admin review status, submitter identity, evidence, and target contractor/snapshot slug.
- Render contractor-submitted context only after verification or review.

**Patterns to follow:**

- Existing Better Auth schema in `server/database/schema/auth.ts`.
- Existing admin activity logging in `server/database/schema/admin.ts`.
- Existing contact/profile claim language in `app/pages/contact.vue` and `app/pages/auth/login.vue`.

**Test scenarios:**

- Happy path: Authenticated user submits a claim request for an existing contractor slug.
- Happy path: Correction request stores target field, explanation, and evidence without changing snapshot data.
- Edge case: Unknown contractor slug returns validation error.
- Error path: Unauthenticated claim request is rejected when authentication is required.
- Integration: Admin review status changes do not alter USAspending-sourced snapshot fields.

**Verification:**

- Public data provenance remains clear.
- Admins can distinguish claim, correction, and source-backed data.

---

- [x] U6. **Introduce teaming discovery surfaces**

**Goal:** Turn profile intelligence into discovery workflows for primes and small businesses.

**Requirements:** R2, R5, R6

**Dependencies:** U4, U5

**Files:**

- Create: `app/pages/teaming/index.vue`
- Create: `server/api/teaming/search.get.ts`
- Create: `server/utils/teaming.ts`
- Test: `tests/server/utils/teaming.test.ts`

**Approach:**

- Start with search/discovery rather than transactions or messaging.
- Match by agency activity, NAICS/PSC overlap, small-business indicators when available, geography, and claimed capabilities.
- Use clear labels for inferred public-data matches versus contractor-declared capabilities.

**Patterns to follow:**

- Existing server-backed search/filter patterns in `server/api/contractors/index.get.ts`.
- Existing profile and category data structures.

**Test scenarios:**

- Happy path: Search by NAICS returns contractors active in that category.
- Happy path: Prime-focused query surfaces potential small-business/teamable matches when signals exist.
- Edge case: Empty capability filters return an empty state with suggestions.
- Error path: Invalid filter values are rejected with a typed validation error.

**Verification:**

- Teaming discovery is useful without claiming a closed marketplace transaction exists.
- Match output identifies why each contractor was returned.

---

- [x] U7. **Plan premium and institutional access**

**Goal:** Define monetization layers after the public trust and workflow foundations exist.

**Requirements:** R2, R4, R5, R6

**Dependencies:** U5, U6

**Files:**

- Create: `docs/premium-institutional-access-plan.md`
- Modify: `prd.md`
- Modify: `README.md`

**Approach:**

- Separate public pages from paid workflow depth.
- Candidate paid layers: deeper metric histories, saved searches, alerts, claimed profile management, teaming discovery tools, bulk exports, and institutional reports.
- Keep corrections and source-backed factual accuracy outside the paid value proposition.

**Patterns to follow:**

- Current README distinction between product, pages, API, and development sections.
- PRD scope boundary pattern.

**Test scenarios:**

- Test expectation: none -- planning/documentation-only unit unless billing/access code is introduced later.

**Verification:**

- Monetization docs avoid pay-to-improve-score language.
- Public trust and data provenance remain first-class constraints.

---

## System-Wide Impact

- **Interaction graph:** Future signal implementation will touch snapshot refresh, profile intelligence, contractor profile API, public profile UI, sitemap/SEO copy, and admin review workflows.
- **Error propagation:** Signal failures should degrade to unavailable/warned states, not profile request failures, unless the base profile cannot load.
- **State lifecycle risks:** Signal snapshots and contractor-submitted context must not overwrite source-backed snapshot rows.
- **API surface parity:** Profile API changes should preserve existing fields and add signal structures in a backward-compatible response shape.
- **Integration coverage:** Future implementation needs profile API tests plus UI component tests for signal rendering and provenance separation.
- **Unchanged invariants:** USAspending remains the source of truth for public award facts. Curated and contractor-submitted data remain overlays.

---

## Risks & Dependencies

| Risk                                                          | Mitigation                                                                                                                        |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Signal methodology could be misleading                        | Start with transparent indicators, caveats, source links, and unavailable states instead of aggregate grades.                     |
| Contractors may perceive profiles as punitive                 | Use intelligence/positioning language, correction workflows, and clear data provenance.                                           |
| Marketplace launch could fail from low liquidity              | Start with discovery and alerts based on existing profile traffic before transactions or messaging.                               |
| Public data quality/entity resolution errors could harm trust | Preserve source links, display identifiers, build correction workflow, and keep methodology auditable.                            |
| Monetization could undermine credibility                      | Never sell factual corrections or score improvements; monetize workflow depth, profile context, alerts, and institutional access. |

---

## Documentation / Operational Notes

- This pass updates documentation only.
- Later schema/API/UI work should update `docs/database-schema.md`, `prd.md`, and `README.md` alongside implementation.
- Any future public signal launch should include methodology documentation before or alongside UI release.

---

## Sources & References

- Related product plan: `docs/open-contractor-intelligence-pivot-plan.md`
- Current PRD: `prd.md`
- Current README: `README.md`
- Schema overview: `docs/database-schema.md`
- Snapshot schema: `server/database/schema/snapshot.ts`
- Intelligence schema: `server/database/schema/intelligence.ts`
- Profile API: `server/api/contractors/[slug].get.ts`
- Profile page: `app/pages/companies/[slug].vue`

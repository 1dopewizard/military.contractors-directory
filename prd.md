# Product Requirements Document: military.contractors

## 1. Product Summary

**Product name:** military.contractors

**Product category:** Open defense contractor intelligence

**Primary promise:** Open intelligence on U.S. defense contractors.

military.contractors is a public intelligence layer for researching U.S. defense contractors through structured company profiles, public award records, agency relationships, NAICS and PSC categories, locations, spending trends, source links, and AI-assisted exploration.

The product is intentionally not a job board, MOS translation product, staffing marketplace, veteran transition funnel, or OCONUS career site. Existing job, MOS, alert, and career-oriented code paths are legacy compatibility surfaces unless they directly support contractor intelligence.

## 2. Why This Exists

Defense contractor information is fragmented across multiple public and private systems:

- USAspending.gov exposes award data, but it is difficult to use for fast company research and comparison.
- SAM.gov provides entity and opportunity data, but it is not optimized for contractor profiles or analytical browsing.
- Company websites and annual reports provide narrative context, but not consistent public award structure.
- Paywalled tools serve enterprise government contracting teams, leaving researchers, journalists, operators, and smaller teams without accessible intelligence.
- General directories such as Wikipedia, LinkedIn, Crunchbase, and company databases are either incomplete for defense or not built around public contracting activity.

military.contractors should make public defense industrial base intelligence easier to search, verify, compare, and cite.

## 3. Product Positioning

### One-Line Positioning

Open intelligence on U.S. defense contractors, backed by structured public award data.

### Category

Public contractor intelligence directory and explorer.

### Differentiators

- Exact-match domain for defense contractor research.
- Structured company profiles connected to public award context.
- Plain-English explorer with deterministic data operations behind every answer.
- Source-first output with visible USAspending/SAM links.
- Public, indexable contractor/category/location surfaces.
- Lightweight enough for open research, but structured enough to become a serious intelligence layer.

### Explicit Non-Positioning

military.contractors must not be publicly positioned as:

- A job board.
- A MOS or AFSC translator.
- A veteran career placement platform.
- An OCONUS pay and tax content site.
- A free-form AI chatbot that invents answers.
- A replacement for authoritative government systems.

## 4. Goals And Non-Goals

### Goals

- Help users quickly understand what a contractor does, where it operates, and how it appears in public award data.
- Let users ask natural-language questions about contractors, agencies, NAICS/PSC categories, locations, keywords, and spending trends.
- Ensure every AI-written summary is backed by structured records, filters, and source links.
- Preserve and extend the existing contractor directory foundation.
- Establish a durable data model for USAspending first, then SAM.gov enrichment.
- Create indexable pages that can rank for contractor, agency, category, and location research queries.
- Keep claimed profiles available without making them the core v1 monetization story.

### Non-Goals

- Do not rebuild a jobs marketplace.
- Do not add MOS pages, military specialty matching, or job alert flows as public v1 features.
- Do not produce generated SEO pages without source-backed data.
- Do not let LLMs calculate totals, rankings, obligations, pagination, or freshness.
- Do not hide public source links behind summaries.
- Do not require login for public contractor intelligence browsing.

## 5. Target Users

### Industry Researcher

Needs to compare contractors, understand market structure, and quickly move from a company name to public award context.

Core questions:

- What does this contractor do?
- Which agencies are tied to this contractor?
- What categories does this contractor appear in?
- How has public obligation activity changed over time?

### Business Development Analyst

Needs to identify contractors by agency, category, location, or keyword, often as a starting point for deeper opportunity research.

Core questions:

- Who are the top contractors for a given agency?
- Which companies show up in NAICS 541512 or a PSC category?
- Which contractors have awards related to cyber, missile, radar, autonomous systems, or sustainment?

### Journalist Or Policy Researcher

Needs accessible explanations with clear source trails and no paywall.

Core questions:

- Which companies are visible in public spending data for this program area?
- Which agency relationships are most prominent?
- What source records support the claim?

### Contractor Profile Owner

Works at or represents a contractor and wants to keep public profile context accurate.

Core questions:

- Is the profile using the right company name, aliases, identifiers, links, and headquarters?
- Can we claim and verify the profile?
- Can we add context that public data alone does not capture?

### Site Operator/Admin

Maintains data quality, claimed profiles, source links, and public content surfaces.

Core questions:

- Which profiles need cleanup?
- Which claim requests require review?
- Are AI summaries backed by structured data?
- Are sitemap and navigation surfaces aligned with the product thesis?

## 6. Primary User Journeys

### Journey 1: Contractor Lookup

1. User searches for a company by name.
2. User lands on `/companies/[slug]`.
3. Page shows company overview, headquarters, specialties, aliases, UEI/CAGE where available, revenue context, and source links.
4. Page shows public award intelligence: total matched obligations, recent awards, top agencies, top NAICS, top PSC, yearly trend.
5. User follows USAspending/SAM/company links for verification.

Success criteria:

- The user can understand the contractor in under 60 seconds.
- Public award claims include visible source links.
- The page remains useful even when no award data exists.

### Journey 2: Plain-English Explorer

1. User enters a query on the homepage, such as "Top Department of the Navy contractors" or "Compare Lockheed Martin and RTX".
2. Backend creates or validates a strict structured plan.
3. Deterministic operations execute filtering, aggregation, ranking, and pagination.
4. Response shows:
   - AI-written summary.
   - Filters used.
   - Ranked table.
   - Cards or yearly trend.
   - Source links and metadata.
5. User can refine the query or click into company profiles.

Success criteria:

- Unsupported queries produce clarification instead of fabricated answers.
- Summary never appears without structured result data.
- Users can inspect which filters were applied.

### Journey 3: Category Or Agency Research

1. User asks for top contractors by agency, NAICS, PSC, location, or keyword.
2. System returns ranked contractors and source-backed award records.
3. User clicks into a contractor profile or source record.

Success criteria:

- Results are deterministic and repeatable.
- Rankings are calculated by backend totals, not model prose.
- Filters are visible and understandable.

### Journey 4: Claimed Profile

1. Contractor representative visits `/for-companies`.
2. Representative searches and claims a company profile.
3. Admin or automated verification approves the claim.
4. Profile owner updates public company context.

Success criteria:

- Claiming supports profile accuracy without turning the site into recruiting software.
- Claimed content is clearly differentiated from source-backed public award data.

## 7. Current Product Surface

### Public Pages

| Surface | Route | Purpose |
| --- | --- | --- |
| Homepage Explorer | `/` | Primary plain-English intelligence explorer |
| Companies Browse | `/companies` | Contractor list with filters |
| Company Profile | `/companies/[slug]` | Company profile plus award intelligence |
| Specialty Pages | `/companies/specialty/[slug]` | Contractor category browse |
| Location Pages | `/companies/location/[state]` | Contractor location browse |
| About | `/about` | Product explanation |
| For Companies | `/for-companies` | Claimed profile positioning |
| Contact | `/contact` | Contact path |
| Privacy | `/privacy` | Privacy policy |
| Terms | `/terms` | Terms of service |

### Authenticated And Admin Surfaces

| Surface | Route | Purpose |
| --- | --- | --- |
| Login | `/auth/login` | Magic link authentication |
| Profile Manager | `/profile-manager` | Claimed profile management |
| Claim Profile | `/profile-manager/claim` | Claim flow |
| Admin | `/admin` | Claims, content, contractors, users |

### Legacy Surfaces

Legacy insights, jobs, MOS, alert, and OCONUS surfaces must not appear in primary navigation, homepage positioning, or sitemap inputs after the pivot. If retained temporarily, they should be considered compatibility-only until a separate cleanup removes or redirects them.

## 8. Functional Requirements

### 8.1 Contractor Directory

The contractor directory must support:

- Contractor search by name.
- Browse by specialty/category.
- Browse by location.
- Sort by revenue, rank, or name where supported.
- Company profile pages with stable slugs.
- Existing claimed-profile integration.

Company profile pages must show:

- Company name.
- Overview/description.
- Headquarters.
- Country.
- Founded year where available.
- Employee count where available.
- Revenue context where available.
- Stock ticker and public/private status where available.
- Website, LinkedIn, Wikipedia links where available.
- Specialties/categories.
- Locations.
- Claimed profile status.
- Intelligence panel when award intelligence exists.

### 8.2 Contractor Intelligence Panel

Company intelligence panels must show:

- Total matched obligations.
- Award count.
- Latest fiscal year.
- Top agency.
- Top NAICS category.
- Top PSC category.
- Recent awards.
- Yearly trend.
- Aliases.
- UEI and CAGE identifiers where available.
- Source links.
- Source metadata and freshness note.

Empty states must explain that no structured public award records are currently connected, rather than implying no awards exist.

### 8.3 Explorer

The explorer must support six MVP query types:

- Company lookup.
- Company comparison.
- Agency top contractors.
- Category search by NAICS/PSC.
- Location search.
- Award keyword search.

Explorer response requirements:

- Query ID or cache ID.
- Original query.
- Validated query plan.
- Result type.
- Summary.
- Filters used.
- Ranked table.
- Summary cards.
- Optional trend chart.
- Source links.
- Source metadata.
- Cached flag.

The explorer must not:

- Display a model-only answer.
- Hide filters.
- Calculate obligations in the model.
- Return unsupported queries as confident answers.
- Use source-less generated text for SEO pages.

### 8.4 Source Links

Every award-backed result must expose source links. V1 source links may point to USAspending search or award pages. Later versions should support direct transaction/source record links where available.

Source metadata must include:

- Source name.
- Source URL.
- Generated or refreshed timestamp.
- Record count.
- Freshness note.

### 8.5 Caching

Explorer results should be cacheable by normalized query hash.

The cache record must store:

- Original query.
- Query hash.
- Structured plan.
- Structured result JSON.
- Generated summary.
- Source metadata.
- Refreshed timestamp.

The API may use memory cache for MVP, but durable cache storage should use `explorerQueryCache`.

## 9. Data Requirements

### Existing Directory Tables

Keep and extend:

- `contractor`
- `specialty`
- `contractorSpecialty`
- `contractorLocation`
- claimed profile tables
- admin/auth tables

### New Intelligence Tables

| Table | Purpose |
| --- | --- |
| `recipientEntity` | Normalized recipient identity linked to contractor profile |
| `award` | Award-level public contract records |
| `awardTransaction` | Transaction or obligation history where available |
| `agency` | Agency reference data |
| `naicsCode` | NAICS reference data |
| `pscCode` | PSC reference data |
| `explorerQueryCache` | Cached explorer plans, results, summaries, and metadata |

### Recipient Entity Requirements

`recipientEntity` must support:

- Normalized recipient name.
- Aliases.
- UEI.
- CAGE code.
- Source.
- Optional linked contractor ID.

### Award Requirements

`award` must support:

- Award ID.
- PIID where available.
- Recipient entity.
- Awarding agency.
- Funding agency.
- NAICS.
- PSC.
- Fiscal year.
- Description.
- Base and total obligations.
- Award type.
- Place of performance.
- Period of performance.
- Source URL.
- Raw source JSON.

### Reference Data Requirements

Reference tables must support:

- Agency names and toptier codes.
- NAICS code, title, and sector.
- PSC code, title, and product/service grouping.

## 10. Data Sources

### V1 Source

USAspending.gov is the first authoritative source for award and obligation intelligence.

V1 ingestion priorities:

- Recipient search.
- Award search.
- Award obligation totals.
- Agency fields.
- NAICS and PSC fields.
- Fiscal year and date fields.
- Source URLs.

### V2 Source

SAM.gov enrichment should follow after the award intelligence loop works.

Potential SAM enrichments:

- Entity registration.
- UEI/CAGE verification.
- Legal business name.
- Entity status.
- Business types.
- NAICS registrations.

### Manual/Seed Data

Seeded records are acceptable for MVP development, demos, tests, and UI validation. Production claims must clearly identify source freshness and must not imply seeded data is comprehensive.

Initial MVP contractor set:

- Lockheed Martin
- RTX
- Northrop Grumman
- Boeing
- General Dynamics
- Leidos
- Booz Allen Hamilton
- CACI International
- Anduril
- Palantir

## 11. Backend Operations

The backend must own deterministic operations:

- `searchAwards`
- `getContractorIntelligence`
- `getTopContractorsByAgency`
- `getTopContractorsByNaics`
- `getTopContractorsByPsc`
- `compareContractors`
- `getSpendingTrend`

Operation requirements:

- Validate inputs.
- Apply filters deterministically.
- Calculate totals and rankings.
- Return stable typed shapes.
- Include source metadata.
- Support empty states.
- Avoid model involvement in math.

## 12. API Requirements

### Public Intelligence API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/intelligence/contractors/[slug]` | Contractor award intelligence profile |
| GET | `/api/intelligence/top-contractors` | Ranked contractors by agency/category/location/keyword filters |

### Explorer API

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/explorer/query` | Plan and execute an explorer query |
| GET | `/api/explorer/cache/[cacheId]` | Return cached explorer result |

### API Response Principles

- Return structured JSON.
- Use zod validation on inputs.
- Use clear HTTP errors for invalid inputs.
- Do not leak internal errors.
- Include source metadata where results depend on public award data.
- Keep response shapes stable enough for UI and tests.

## 13. AI Requirements

### Allowed Model Responsibilities

The model may:

- Classify user intent.
- Extract contractor names, agencies, locations, categories, fiscal years, and keywords.
- Map plain English into candidate structured filters.
- Generate a short summary from structured results.
- Ask for clarification when the query is unsupported or ambiguous.

### Forbidden Model Responsibilities

The model must not:

- Calculate totals.
- Rank contractors.
- Filter raw records.
- Invent award records.
- Invent source links.
- Present conclusions without structured data.
- Write unsupported claims into durable SEO pages.

### Planning Contract

LLM-generated plans must validate against a strict zod schema before execution. Invalid plans must be rejected and converted to a clarification response.

### Summary Contract

Generated summaries must be derived from:

- Structured result rows.
- Summary cards.
- Trend buckets.
- Filters used.
- Source metadata.

The UI must show the structured data near the summary.

## 14. Frontend Requirements

### Design Principles

- Work-focused and data-forward.
- Minimal and flat.
- No marketing-heavy hero treatment for core app surfaces.
- Tables, filters, cards, and source links should be easy to scan.
- Public data and source links should be more prominent than decorative UI.
- Mobile responsive by default.

### Homepage

Homepage must include:

- Clear product thesis.
- Explorer query input.
- Example queries.
- Explorer output with summary, filters, cards, chart/table, and source links.
- Major contractor links.
- Category browsing.

Homepage must not include:

- Job alert CTAs.
- MOS search prompts.
- Veteran career translation positioning.

### Company Profile

Company profile must include:

- Company overview.
- Key facts.
- Intelligence panel.
- Categories.
- Locations.
- External links.
- Claimed profile context where applicable.

Company profile must de-emphasize or remove:

- Careers CTAs.
- "Why work here" positioning.
- Employee testimonial framing.
- Job seeker language.

### Navigation

Primary navigation should prioritize:

- Companies.
- About.
- Search/explorer access.
- Auth/profile controls as needed.

Primary navigation must not link MOS/job/legacy insights surfaces.

## 15. SEO And AEO Requirements

### Indexable Surfaces

V1 indexable surfaces:

- Homepage.
- Companies browse.
- Company profiles.
- Specialty/category pages.
- Location pages.
- About.

V2 indexable surfaces:

- Top contractors by agency.
- Top contractors by NAICS.
- Top contractors by PSC.
- Agency pages.
- NAICS pages.
- PSC pages.
- Public dataset pages.

### Structured Data

Use appropriate Schema.org types:

- `WebSite`
- `WebPage`
- `Organization`
- `CollectionPage`
- `BreadcrumbList`
- `Dataset` for durable intelligence datasets when implemented.

### SEO Guardrails

- Do not create thin AI-generated pages.
- Do not publish generated summaries without structured data and sources.
- Keep canonical URLs stable.
- Keep source links visible on intelligence pages.
- Remove MOS/job pages from sitemap and primary navigation after pivot.

## 16. Monetization

V1 focus is trust, data quality, and durable public utility, not immediate recruiting revenue.

Potential monetization paths:

- Claimed profile subscriptions.
- Research exports.
- Saved intelligence workspaces.
- Alerts for companies/agencies/categories.
- Sponsored research reports, clearly labeled.
- Enterprise data access.

Not in v1 monetization:

- Placement fees.
- Sponsored job listings.
- MOS career pages.
- Job alerts.
- Recruiting marketplace features.

## 17. Metrics

### Product Metrics

- Contractor profile views.
- Explorer queries submitted.
- Explorer successful response rate.
- Explorer clarification rate.
- Source link click-through rate.
- Company profile to source-link click-through rate.
- Repeat usage by unauthenticated users.
- Claimed profile starts and completions.

### Data Quality Metrics

- Contractors linked to recipient entities.
- Contractors with UEI/CAGE identifiers.
- Contractors with recent award data.
- Award records ingested.
- Awards with agency, NAICS, PSC, fiscal year, and source URL.
- Query cache hit rate.
- Stale cache count.

### SEO Metrics

- Indexed contractor pages.
- Organic clicks to contractor profiles.
- Organic clicks to category/location pages.
- Search impressions for contractor/category/agency terms.
- Pages with structured data errors.

## 18. Roadmap

### Phase 1: Reposition

Status: Implemented.

Scope:

- Rewrite public positioning.
- Remove job/MOS-first language from primary surfaces.
- Add pivot plan.
- Update homepage to intelligence explorer.
- Update company profile pages.
- Remove legacy pages from primary navigation and sitemap.

Acceptance criteria:

- Homepage is contractor-intelligence-first.
- README and PRD align with the pivot.
- About page explains intelligence product.
- Navigation and sitemap do not promote MOS/job surfaces.

### Phase 2: Data Foundation

Status: MVP implemented with schema, seed-shaped data, operations, and migration.

Scope:

- Add intelligence schema.
- Add migration.
- Add deterministic operations.
- Add USAspending adapter boundary.
- Add tests for planning and aggregation.

Acceptance criteria:

- `pnpm db:migrate` succeeds.
- Contractor intelligence endpoint returns stable data for seeded contractors.
- Explorer endpoint returns structured result shapes.

### Phase 3: Live USAspending Ingestion

Status: Next.

Scope:

- Build ingestion script or scheduled job.
- Normalize recipient entities.
- Upsert agencies, NAICS, PSC, awards, transactions.
- Link recipient entities to existing contractors.
- Track source freshness.

Acceptance criteria:

- At least 10 major contractors have live USAspending-backed award records.
- Ingestion is repeatable.
- Duplicate awards are not created.
- Source freshness is visible in API responses.

### Phase 4: Explorer V2

Status: Next.

Scope:

- Replace heuristic planning with strict LLM JSON planning where useful.
- Persist query cache in `explorerQueryCache`.
- Support pagination and drill-down.
- Add comparison views.
- Add richer category mapping.

Acceptance criteria:

- Invalid model plans are rejected.
- Cached results are reused.
- User can inspect filters and source links.
- Unsupported queries ask for clarification.

### Phase 5: Durable Intelligence Pages

Status: Future.

Scope:

- Agency pages.
- NAICS pages.
- PSC pages.
- Top contractor rankings by agency/category.
- Dataset schema.
- Internal linking between contractor, agency, category, and location pages.

Acceptance criteria:

- Each generated page has structured data and source links.
- No page is just generated prose.
- Sitemap includes only durable, source-backed pages.

### Phase 6: Claimed Profile Refinement

Status: Future.

Scope:

- Reframe profile management around accuracy and source context.
- Remove remaining job seeker language from dashboards.
- Add profile data quality workflows.
- Add claimed profile audit trail.

Acceptance criteria:

- Claimed profile UI does not rely on recruiting language.
- Admin can distinguish source-backed fields from claimed fields.
- Public pages clearly separate public source data from claimed context.

## 19. Risks And Mitigations

### Risk: AI Hallucination

Mitigation:

- Strict plans.
- Backend-owned calculations.
- Source-backed summaries.
- Visible filters and records.

### Risk: Public Data Ambiguity

Mitigation:

- Normalize recipient entities.
- Show aliases and identifiers.
- Keep source links visible.
- Include freshness and coverage notes.

### Risk: Thin SEO Content

Mitigation:

- Generate pages only when there is enough structured data.
- Require source links.
- Use tables and datasets, not just prose.

### Risk: Legacy Product Confusion

Mitigation:

- Keep job/MOS surfaces out of nav and sitemap.
- Continue copy cleanup.
- Remove or redirect legacy routes in a dedicated cleanup.

### Risk: Incomplete Award Coverage

Mitigation:

- Clearly label data freshness and source scope.
- Avoid claims of comprehensive coverage until ingestion proves it.
- Track data quality metrics.

## 20. Compliance And Content Standards

- Do not imply endorsement by the U.S. government.
- Do not present public award data as complete without a freshness/coverage note.
- Do not conflate parent companies, subsidiaries, and recipient entities without identifiers.
- Do not publish unverifiable claims as facts.
- Label claimed-profile content separately from public source data where needed.
- Respect robots, rate limits, and API terms for upstream data sources.

## 21. Test And Verification Plan

### Unit Tests

- Query planner schema acceptance/rejection.
- Query intent classification.
- Award filtering.
- Aggregation math.
- Spending trend generation.
- Contractor intelligence summary shape.

### API Tests

- Contractor intelligence endpoint returns stable shape.
- Top contractors endpoint respects filters.
- Explorer endpoint rejects unsupported or ambiguous queries.
- Explorer cache endpoint returns cached results.
- Empty states are explicit and safe.

### UI Tests

- Homepage renders explorer input, filters, cards, table/chart, and source links.
- Company profile renders intelligence sections with populated and empty states.
- Navigation excludes legacy MOS/job surfaces.
- Sitemap excludes legacy MOS/job surfaces.

### Manual Verification

Run:

```bash
pnpm test:run
pnpm build
pnpm db:migrate
```

Run after schema edits:

```bash
pnpm db:generate
```

## 22. Acceptance Criteria For V1

V1 is acceptable when:

- The product is consistently positioned as open contractor intelligence.
- Homepage explorer can answer the six MVP query types with structured data.
- Company profiles include award intelligence panels.
- Public API routes return stable typed shapes.
- AI-generated text is always backed by structured data.
- Navigation and sitemap no longer promote job/MOS surfaces.
- Tests and build pass.
- Data model supports live USAspending ingestion.

## 23. Open Questions

- Should legacy insights pages be redirected, noindexed, or removed entirely?
- What is the first durable SEO page type after company profiles: agency, NAICS, PSC, or top contractors?
- How should parent/subsidiary relationships be represented for large defense primes?
- What freshness SLA should public pages display for award data?
- Should explorer cache be public-linkable by default?
- Which fields should claimed profile owners be allowed to override versus annotate?

# PRD -- military.contractors

## 1. Summary

**Product:** Open intelligence layer for U.S. defense contractors.

`military.contractors` helps researchers, analysts, business development teams, journalists, and industry professionals understand defense contractors through structured profiles, public award data, agencies, NAICS/PSC categories, locations, and spending trends.

The product is not a job board, MOS translator, or veteran career platform. Legacy job, MOS, alert, and OCONUS surfaces may remain for compatibility during the transition, but they are not public positioning or future product pillars.

## 2. Vision

Defense contractor data is fragmented across USAspending, SAM.gov, company pages, press releases, and paywalled industry tools. The opportunity is a public, searchable, citation-forward intelligence layer that makes contractor activity easy to compare and verify.

Primary thesis:

> Open intelligence on U.S. defense contractors.

## 3. Competitive Landscape

| Competitor | Focus | Weakness |
| --- | --- | --- |
| USAspending.gov | Raw federal spending data | Powerful but hard to explore by company narrative |
| SAM.gov | Entity and opportunity data | Fragmented search and limited profile context |
| Bloomberg Government | Federal contracting intelligence | Paywalled enterprise product |
| GovWin | Opportunity and BD workflows | Paywalled, opportunity-led |
| Wikipedia | General encyclopedia | Sparse structured award/category data |
| Crunchbase | Startup/company data | Weak defense contracting coverage |

**Position:** Public, structured contractor intelligence combining directory profiles, award summaries, source links, and AI-assisted exploration.

## 4. Users

### Industry Researcher

Compares contractors, agencies, categories, and public spending trends without starting from raw government portals.

### Business Development Analyst

Finds top contractors by agency, NAICS, PSC, location, or keyword and follows source links back to USAspending/SAM records.

### Journalist Or Policy Researcher

Needs accessible contractor context with visible source attribution and structured data behind summaries.

### Contractor Profile Owner

Claims a profile to keep public company context accurate. Claimed profiles remain available, but intelligence data and source attribution drive the product.

## 5. Site Architecture

| Surface | URL Pattern | Purpose |
| --- | --- | --- |
| Homepage Explorer | `/` | Plain-English contractor intelligence search |
| Companies | `/companies` | Contractor directory and filters |
| Company Profiles | `/companies/[slug]` | Company profile plus award intelligence |
| Specialties | `/companies/specialty/[slug]` | Contractor category pages |
| Locations | `/companies/location/[state]` | Contractor location pages |
| Claimed Profiles | `/for-companies`, `/profile-manager/*` | Profile claim and management |
| Admin | `/admin` | Admin review and operations |

Legacy insights, job alerts, MOS, and OCONUS pages must not be linked from primary navigation or sitemap inputs after the pivot.

## 6. Contractor Directory

The directory remains the foundation and includes:

- Company name, slug, overview, headquarters, locations, specialties.
- Revenue context and public/private status.
- External source links.
- Claimed profile status where applicable.
- Intelligence panels for public award records, agencies, categories, and obligations.

## 7. Intelligence Data

### Tables

- `recipientEntity`: normalized recipient identity, UEI, CAGE, aliases, linked contractor.
- `award`: award-level public contract records.
- `awardTransaction`: transaction/obligation history.
- `agency`: agency reference data.
- `naicsCode`: NAICS reference data.
- `pscCode`: PSC reference data.
- `explorerQueryCache`: normalized plans, structured results, summaries, and source metadata.

### Operations

- `searchAwards`
- `getContractorIntelligence`
- `getTopContractorsByAgency`
- `getTopContractorsByNaics`
- `getTopContractorsByPsc`
- `compareContractors`
- `getSpendingTrend`

Backend operations own totals, rankings, filtering, pagination, source attribution, and cache freshness.

## 8. Explorer MVP

Users ask plain-English questions such as:

- “Top Department of the Navy contractors by obligations”
- “Compare Lockheed Martin and RTX”
- “Show cyber awards in Virginia”
- “Which contractors have missile awards?”
- “Top NAICS 541512 contractors”

Supported query types:

- Company lookup
- Company comparison
- Agency top contractors
- Category search by NAICS/PSC
- Location search
- Award keyword search

Explorer responses must include:

- Validated structured query plan.
- Filters used.
- Generated summary.
- Ranked table.
- Cards or trend chart.
- USAspending/SAM source metadata and source links.

## 9. AI Rules

- LLM plans must output strict JSON matching zod schemas.
- The model can classify intent, extract filters, map plain English to categories, and write summaries.
- The backend owns all math, rankings, filtering, source links, and cache freshness.
- AI output must never appear without backing structured data.
- Unsupported or ambiguous queries should return a clarification response rather than fabricated answers.

## 10. Public API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/intelligence/contractors/[slug]` | Contractor intelligence profile |
| GET | `/api/intelligence/top-contractors` | Top contractors by filters |
| POST | `/api/explorer/query` | Planner and deterministic operation router |
| GET | `/api/explorer/cache/[cacheId]` | Cached explorer result |

## 11. SEO And AEO

Indexable durable pages should focus on:

- Major contractor profiles.
- Top contractors by agency.
- Top contractors by NAICS/PSC.
- Contractor location pages.
- Agency and category explainers once enough source data exists.

Structured data should include Organization, WebPage, BreadcrumbList, CollectionPage, and Dataset where appropriate. Thin generated pages are not acceptable; each page needs visible structured data and source links.

## 12. Monetization

V1 focus is audience and durable data utility, not recruiting.

Potential later monetization:

- Claimed profile subscriptions.
- Research exports.
- Sponsored data reports clearly labeled as sponsored.
- Enterprise alerting or saved intelligence workspaces.

Placement fees, sponsored jobs, MOS career pages, and job alerts are not part of the v1 strategy.

## 13. Test Plan

- Unit tests for query planning, zod schema validation, and aggregation math.
- API tests for stable response shapes and cache behavior.
- UI tests for homepage explorer and company intelligence panels.
- Regression check that MOS/job pages are not linked from primary navigation or sitemap.

Verification commands:

```bash
pnpm test:run
pnpm build
pnpm db:generate
pnpm db:migrate
```

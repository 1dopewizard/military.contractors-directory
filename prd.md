# PRD – military.contractors

## 1. Summary

**Product:** The definitive directory of defense contractors.

**Core Experience:** Authoritative, well-structured company profiles for 200-300 defense contractors. Users research companies by name, browse by specialty or location, and find the information they need to understand the defense contracting landscape.

**Positioning:** military.contractors is to defense contractors what Crunchbase is to startups — the reference destination for company intelligence.

**Business Model:**
1. Advertising (display ads, contextual)
2. Claimed/verified employer profiles (future)
3. Featured company placements (future)

**Key Differentiators:**
1. **Domain authority** — `military.contractors` is memorable and SEO-powerful
2. **Defense-focused** — Not diluted by non-defense companies
3. **Structured data** — Clean, consistent profiles optimized for search and AI citations
4. **Contract intelligence** — USAspending data that general directories don't have

---

## 2. Why This Model?

### Strategic Rationale

| Factor | Directory Model | Community Intel (Previous) | Job Aggregator (Rejected) |
|--------|-----------------|----------------------------|---------------------------|
| **Time to value** | Fast (data is available) | Slow (cold-start problem) | Medium |
| **Maintenance** | Low (annual refresh) | High (moderation, verification) | High (constant scraping) |
| **SEO potential** | High (company pages rank) | Medium | Low |
| **Execution complexity** | Low | High | High |
| **Revenue path** | Clear (ads, sponsorship) | Complex (access tiers) | Competitive |

### The Insight

People search for defense contractors by name constantly:
- "Lockheed Martin contractor"
- "CACI government contractor"
- "top defense contractors"
- "defense contractors in Virginia"

There's no authoritative, defense-focused directory. Wikipedia covers the big players; everyone else is scattered across press releases, LinkedIn, and paywalled databases.

**military.contractors can own this search intent** with structured, SEO-optimized company profiles.

### Why Not Community Intel?

The previous model (community-driven salary/interview data) was strategically sound but had a critical flaw: **the cold-start problem**. Without existing data, users won't contribute. Without contributions, there's no data.

The directory model provides immediate value from day one — no chicken-and-egg problem.

---

## 3. Competitive Landscape

| Competitor | Focus | Weakness |
|------------|-------|----------|
| **Wikipedia** | General encyclopedia | Only covers major contractors; not structured for comparison |
| **Crunchbase** | Startups, tech companies | Weak defense coverage; tech-focused |
| **Bloomberg Government** | Federal contracting intel | Paywalled; enterprise pricing |
| **GovWin** | Contract opportunities | BD-focused; not company profiles |
| **LinkedIn** | Professional network | Company pages lack structure; no defense specialization |

**Our Position:** The free, authoritative, defense-focused company directory.

**Defensibility:**
- Domain authority (`military.contractors`)
- SEO position (first-mover on "[company] defense contractor" queries)
- Structured data (clean, consistent profiles)
- Defense-specific enrichment (contract data, specialties)

---

## 4. User Personas

### Primary: Job Seeker / Career Researcher

| Attribute | Detail |
|-----------|--------|
| **Profile** | Veteran transitioning to contracting, or civilian exploring defense careers |
| **Situation** | Researching potential employers |
| **Goal** | Understand company size, specialties, locations, reputation |
| **Behavior** | Searches "[company name]", browses by specialty, compares companies |

### Secondary: Industry Professional

| Attribute | Detail |
|-----------|--------|
| **Profile** | Current contractor employee, recruiter, BD professional |
| **Situation** | Researching competitors, partners, or acquisition targets |
| **Goal** | Quick reference on company basics |
| **Behavior** | Direct company lookups, browse by specialty |

### Tertiary: Journalist / Analyst

| Attribute | Detail |
|-----------|--------|
| **Profile** | Defense reporter, market analyst, academic researcher |
| **Situation** | Writing about defense industry |
| **Goal** | Factual company information, rankings, context |
| **Behavior** | Uses site as reference; may cite in articles |

---

## 5. Goals & Non-Goals

### Goals

**Product:**
- Become the go-to reference for defense contractor information
- Rank on first page for "[company name] contractor" searches
- Provide structured, accurate, up-to-date company data

**Business:**
- Build SEO authority that generates sustainable organic traffic
- Establish foundation for future monetization (ads, sponsorship)
- Create asset that compounds in value over time

**Technical:**
- Clean, fast, accessible company pages
- Structured data (schema.org) for rich search results
- Simple architecture with low maintenance burden

### Non-Goals (v1)

- Community features (reviews, salary reports, forums)
- Job listings or job board functionality
- User accounts or authentication
- Real-time data updates
- Mobile app
- API access

---

## 6. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Public Experience Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  HOMEPAGE (/)                                                   │
│  └── Value prop: "The definitive directory of defense contractors" │
│  └── Search bar (company name search)                           │
│  └── Browse by: Specialty, Location, Size                       │
│  └── Featured/Top contractors                                   │
├─────────────────────────────────────────────────────────────────┤
│  COMPANY PAGES (/companies/[slug])                              │
│  └── Company overview (description, founding, HQ)               │
│  └── Key facts (employees, revenue, stock ticker)               │
│  └── Specialties / capabilities                                 │
│  └── Locations                                                  │
│  └── Contract highlights (from USAspending)                     │
│  └── External links (website, LinkedIn, Wikipedia)              │
├─────────────────────────────────────────────────────────────────┤
│  BROWSE PAGES                                                   │
│  └── /companies (all companies, paginated)                      │
│  └── /companies/specialty/[specialty] (by capability)           │
│  └── /companies/location/[state] (by location)                  │
│  └── /companies/size/[size] (by employee count)                 │
├─────────────────────────────────────────────────────────────────┤
│  LIST PAGES (SEO)                                               │
│  └── /top-defense-contractors                                   │
│  └── /top-[specialty]-contractors                               │
│  └── /defense-contractors-in-[state]                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer (libSQL/Drizzle)               │
├─────────────────────────────────────────────────────────────────┤
│  companies — Company profiles (200-300 rows)                    │
│  companySpecialties — Company-to-specialty mappings             │
│  companyLocations — Company office locations                    │
│  contracts — USAspending contract summaries                     │
│  specialties — Specialty/capability taxonomy                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Pipeline (TypeScript)                   │
├─────────────────────────────────────────────────────────────────┤
│  1. Seed from Defense News Top 100                              │
│  2. Enrich with People Data Labs / Wikipedia                    │
│  3. Add USAspending contract data                               │
│  4. LLM categorization for specialties                          │
│  5. Annual refresh cycle                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Core Data Model

### companies

| Field | Type | Source | Purpose |
|-------|------|--------|---------|
| `id` | string | Generated | Primary key |
| `slug` | string | Generated | URL-friendly identifier |
| `name` | string | Defense News / PDL | Company name |
| `description` | text | Wikipedia / PDL | Company overview |
| `founded` | integer | Wikipedia / PDL | Founding year |
| `headquarters` | string | PDL | HQ city, state |
| `employeeCount` | integer | PDL | Current employee count |
| `employeeCountSource` | string | — | Data source for employee count |
| `revenue` | integer | SEC / Defense News | Annual revenue (if public) |
| `stockTicker` | string | PDL | Stock symbol (if public) |
| `isPublic` | boolean | PDL | Public vs. private |
| `website` | string | PDL | Company website URL |
| `linkedinUrl` | string | PDL | LinkedIn company page |
| `wikipediaUrl` | string | Manual | Wikipedia article URL |
| `logoUrl` | string | Clearbit / Manual | Company logo |
| `defenseNewsRank` | integer | Defense News | Rank in Top 100 (if applicable) |
| `totalContractValue` | integer | USAspending | Total federal contract dollars |
| `contractCount` | integer | USAspending | Number of federal contracts |
| `topAgencies` | json | USAspending | Top contracting agencies |
| `createdAt` | timestamp | — | Record creation |
| `updatedAt` | timestamp | — | Last update |

### specialties

| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Primary key |
| `slug` | string | URL-friendly identifier |
| `name` | string | Display name (e.g., "Cybersecurity") |
| `description` | text | What this specialty includes |

**Specialty Taxonomy:**
- IT Services & Cybersecurity
- Intelligence & Analytics
- Logistics & Supply Chain
- Engineering & Technical Services
- Aerospace & Defense Systems
- Professional Services & Consulting
- Facilities & Base Operations
- Communications & Electronics
- Research & Development
- Training & Simulation

### companySpecialties

| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Primary key |
| `companyId` | string | FK to companies |
| `specialtyId` | string | FK to specialties |
| `isPrimary` | boolean | Is this a primary specialty? |

### companyLocations

| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Primary key |
| `companyId` | string | FK to companies |
| `city` | string | City name |
| `state` | string | State code |
| `isHeadquarters` | boolean | Is this the HQ? |

---

## 8. Data Sources & Pipeline

### Phase 1: Seed Data (Top 100)

| Source | Data | Access |
|--------|------|--------|
| **Defense News Top 100** | Company names, ranks, revenue | Free, published annually |
| **Wikipedia** | Descriptions, founding dates, HQ | Free, CC-licensed |
| **Company websites** | Basic info, logos | Free, manual collection |

### Phase 2: Enrichment

| Source | Data | Cost |
|--------|------|------|
| **People Data Labs** | Employee count, locations, social links | ~$0.10-0.20/company |
| **Clearbit Logo API** | Company logos | Free tier available |
| **OpenAI/Claude** | Specialty categorization from descriptions | ~$0.01/company |

### Phase 3: Contract Intelligence

| Source | Data | Access |
|--------|------|--------|
| **USAspending.gov** | Contract awards, values, agencies | Free API |

### Refresh Cycle

| Data Type | Frequency | Method |
|-----------|-----------|--------|
| Employee counts | Quarterly | People Data Labs re-pull |
| Contract data | Quarterly | USAspending API |
| Defense News rankings | Annually | Manual update |
| Company descriptions | As needed | Manual review |

---

## 9. SEO Strategy

### Target Keywords

| Category | Example Keywords | Volume |
|----------|------------------|--------|
| **Company + "contractor"** | "Leidos contractor", "CACI defense contractor" | High |
| **Top lists** | "top defense contractors", "largest military contractors" | High |
| **Specialty** | "cybersecurity defense contractors", "logistics contractors" | Medium |
| **Location** | "defense contractors in Virginia", "DC area contractors" | Medium |

### Page Strategy

| Page Type | URL Pattern | SEO Target | Count |
|-----------|-------------|------------|-------|
| Company profile | `/companies/[slug]` | "[Company] contractor" | 200-300 |
| Specialty browse | `/companies/specialty/[slug]` | "[Specialty] defense contractors" | 10 |
| Location browse | `/companies/location/[state]` | "defense contractors in [State]" | 50 |
| Top lists | `/top-defense-contractors` | "top defense contractors" | 1+ |

### Technical SEO

- **Structured data:** Organization schema on company pages
- **Internal linking:** Cross-link companies by specialty, location
- **Fast loading:** Static generation, edge caching
- **Mobile-first:** Responsive design

---

## 10. Roadmap

### Phase 1: Foundation (Current)

| Task | Status |
|------|--------|
| New PRD (this document) | ✅ Done |
| Schema design for directory model | ⏳ Pending |
| Compile target company list (200-300) | ⏳ Pending |
| Seed data from Defense News Top 100 | ⏳ Pending |
| Basic company profile page | ⏳ Pending |
| Company browse/search | ⏳ Pending |
| Homepage redesign | ⏳ Pending |

### Phase 2: Enrichment

| Task | Status |
|------|--------|
| People Data Labs integration | 🔮 Future |
| USAspending contract data | 🔮 Future |
| Specialty categorization (LLM) | 🔮 Future |
| Location pages | 🔮 Future |
| Top lists pages | 🔮 Future |

### Phase 3: Growth

| Task | Status |
|------|--------|
| Claimed employer profiles | 🔮 Future |
| Advertising integration | 🔮 Future |
| Featured company placements | 🔮 Future |
| API access (paid) | 🔮 Future |

---

## 11. Monetization

### Core Principle

**The directory is free.** Revenue comes from optional visibility upgrades and advertising.

### Revenue Streams (Future)

| Product | Model | Description |
|---------|-------|-------------|
| **Display Advertising** | CPM | Programmatic ads on high-traffic pages |
| **Claimed Profiles** | $99-299/month | Employers update their own profile, add jobs link |
| **Featured Placement** | $199-499/month | Top position in browse/search results |
| **Sponsored Content** | Per placement | "Sponsored by [Company]" sections |

### Phase 1 Focus

No monetization in Phase 1. Focus on building traffic and SEO authority. Monetization starts once site has consistent organic traffic (target: 10K+ monthly visitors).

---

## 12. Success Metrics

### Traffic

| Metric | Phase 1 Target | Scale Target |
|--------|----------------|--------------|
| Monthly visitors | 1,000 | 25,000+ |
| Organic search traffic | 50% | 80%+ |
| Pages per session | 2+ | 3+ |

### SEO

| Metric | Target |
|--------|--------|
| Company pages indexed | 200+ |
| Top 10 rankings for "[company] contractor" | 50+ companies |
| Domain authority (Moz/Ahrefs) | 30+ |

### Content

| Metric | Phase 1 Target | Scale Target |
|--------|----------------|--------------|
| Company profiles | 100 | 300+ |
| Profiles with full data | 80% | 95% |
| Data freshness (< 6 months old) | 90% | 95% |

---

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **SEO competition** | Hard to rank | Focus on long-tail "[company] contractor" queries first |
| **Data accuracy** | User distrust | Multiple sources, clear "last updated" dates |
| **Data staleness** | Outdated info | Quarterly refresh cycle, user feedback mechanism |
| **Low traffic** | No revenue path | Focus on SEO fundamentals, be patient |
| **Competitor copies** | Reduced differentiation | Move fast, build domain authority, add unique data |

---

## 14. Sister Site: mos.directory

**Relationship:** Simplified from previous model.

| Site | Intent | Content |
|------|--------|---------|
| **mos.directory** | "What is MOS 25B?" | MOS encyclopedia, branch navigation |
| **military.contractors** | "Who is Leidos?" | Company directory, contractor profiles |

**Cross-linking (optional):**
- Company pages could show "Common MOSes hired" if data exists
- MOS pages could link to "Companies that hire this MOS"

**Shared Infrastructure:**
- Same database (libSQL)
- Same deployment (Coolify)
- Separate Nuxt apps

**Note:** MOS integration is optional. The directory model works standalone without MOS data. If MOS integration adds value later, it can be added, but it's not required for v1.

---

## 15. Migration from Previous Model

### What to Keep

- Nuxt 4 + libSQL/Drizzle infrastructure
- Basic deployment setup (Coolify)
- Domain and hosting

### What to Remove/Archive

- Community tables (salaryReports, interviewExperiences)
- Community UI components
- Access tier logic
- Contributor features

### What to Rebuild

- Company schema (expanded from existing)
- Company pages (redesigned for directory model)
- Homepage (new focus)
- Browse/search functionality

---

## Appendix A: Company List Sources

### Defense News Top 100 (2024)

Primary source for initial company list. Published annually with:
- Company name
- Rank by defense revenue
- Total revenue
- Headquarters location

### Additional Sources

- Washington Technology Top 100 (government IT focus)
- BGOV 200 (broader federal contractors)
- Manual additions (notable specialists not on lists)

---

## Appendix B: Previous Model History

### Community Intel Platform (January 2026)

Planned community-driven salary and interview data platform. Pivoted due to:
- Cold-start problem (no data → no users → no data)
- High execution complexity
- Long time to value

### Career Intelligence Platform (Earlier)

Company-MOS mapping focus. Pivoted due to:
- Low retention
- Weak revenue model

### Job Aggregator (Original Concept)

Rejected due to:
- Scraping complexity
- Legal risk
- Competition with funded players

---

## Related Documentation

| Doc | Purpose |
|-----|---------|
| `.cursor/plans/directory_implementation.plan.md` | Implementation plan (to be created) |
| `apps/contractors/docs/database-schema.md` | Table definitions |
| `AGENTS.md` | Cursor/agent conventions |

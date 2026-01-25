# PRD – military.contractors

## 1. Summary

**Product:** The definitive directory of defense contractors.

**Core Experience:** Authoritative, well-structured company profiles for 200-300 defense contractors. Users research companies by name, browse by specialty or location, and find the information they need to understand the defense contracting landscape.

**Positioning:** military.contractors is to defense contractors what Crunchbase is to startups — the reference destination for company intelligence.

**Business Model:**
1. Claimed employer profiles ($149-399/month)
2. Featured company placements (Premium tier)
3. Display advertising (future)

**Key Differentiators:**
1. **Domain authority** — `military.contractors` is memorable and SEO-powerful
2. **Defense-focused** — Not diluted by non-defense companies
3. **Structured data** — Clean, consistent profiles optimized for search and AI citations
4. **Claimed profiles** — Employers can verify and enhance their company pages

---

## 2. Why This Model?

### Strategic Rationale

| Factor | Directory Model | Community Intel (Previous) | Job Aggregator (Rejected) |
|--------|-----------------|----------------------------|---------------------------|
| **Time to value** | Fast (data is available) | Slow (cold-start problem) | Medium |
| **Maintenance** | Low (annual refresh) | High (moderation, verification) | High (constant scraping) |
| **SEO potential** | High (company pages rank) | Medium | Low |
| **Execution complexity** | Low | High | High |
| **Revenue path** | Clear (claimed profiles) | Complex (access tiers) | Competitive |

### The Insight

People search for defense contractors by name constantly:
- "Lockheed Martin contractor"
- "CACI government contractor"
- "top defense contractors"
- "defense contractors in Virginia"

There's no authoritative, defense-focused directory. Wikipedia covers the big players; everyone else is scattered across press releases, LinkedIn, and paywalled databases.

**military.contractors owns this search intent** with structured, SEO-optimized company profiles.

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
- Defense-specific enrichment (specialties, verified profiles)

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

### Tertiary: Employer / HR

| Attribute | Detail |
|-----------|--------|
| **Profile** | Defense contractor HR or marketing team |
| **Situation** | Managing company's public profile for recruiting |
| **Goal** | Control company narrative, showcase culture |
| **Behavior** | Claims profile, adds benefits/programs, monitors analytics |

---

## 5. Goals & Non-Goals

### Goals

**Product:**
- Become the go-to reference for defense contractor information
- Rank on first page for "[company name] contractor" searches
- Provide structured, accurate, up-to-date company data
- Enable employers to claim and enhance their profiles

**Business:**
- Build SEO authority that generates sustainable organic traffic
- Generate revenue through claimed profile subscriptions
- Create asset that compounds in value over time

**Technical:**
- Clean, fast, accessible company pages
- Structured data (schema.org) for rich search results
- Simple architecture with low maintenance burden

### Non-Goals

- Job listings or job board functionality
- Community features (reviews, salary reports, forums)
- Real-time data updates
- Mobile app
- Public API access

---

## 6. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Public Experience Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  HOMEPAGE (/)                                                   │
│  └── Value prop: "The definitive directory of defense contractors" │
│  └── Search bar (company name search)                           │
│  └── Browse by: Specialty, Location                             │
│  └── Top contractors grid                                       │
├─────────────────────────────────────────────────────────────────┤
│  CONTRACTOR PAGES (/contractors/[slug])                         │
│  └── Company overview (description, founding, HQ)               │
│  └── Key facts (employees, revenue, stock ticker)               │
│  └── Specialties / capabilities                                 │
│  └── Locations                                                  │
│  └── External links (website, LinkedIn, Wikipedia)              │
│  └── [Claimed] Why Work Here, Programs, Spotlight, Testimonials │
├─────────────────────────────────────────────────────────────────┤
│  BROWSE PAGES                                                   │
│  └── /contractors (all contractors, paginated)                  │
│  └── /contractors/specialty/[slug] (by capability)              │
│  └── /contractors/location/[state] (by location)                │
├─────────────────────────────────────────────────────────────────┤
│  SEO LIST PAGES                                                 │
│  └── /top-defense-contractors                                   │
├─────────────────────────────────────────────────────────────────┤
│  EMPLOYER PAGES                                                 │
│  └── /for-employers (marketing landing page)                    │
│  └── /profile-manager (employer dashboard)                      │
│  └── /profile-manager/claim (claim flow)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer (libSQL/Drizzle)               │
├─────────────────────────────────────────────────────────────────┤
│  contractor — Contractor profiles (48+ rows)                    │
│  contractorSpecialty — Contractor-to-specialty mappings         │
│  contractorLocation — Contractor office locations               │
│  specialty — Specialty/capability taxonomy                      │
│  claimedProfile — Employer-claimed profile records              │
│  employerUser — Users linked to claimed profiles                │
│  employerBenefit — "Why Work Here" benefits                     │
│  employerProgram — Notable programs/products                    │
│  employerTestimonial — Employee testimonials                    │
│  sponsoredContent — Spotlight content blocks                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Core Data Model

### contractor

| Field | Type | Source | Purpose |
|-------|------|--------|---------|
| `id` | string | Generated | Primary key |
| `slug` | string | Generated | URL-friendly identifier |
| `name` | string | Defense News | Company name |
| `description` | text | GPT / Manual | Company overview |
| `founded` | integer | Public data | Founding year |
| `headquarters` | string | Public data | HQ city, state |
| `employeeCount` | string | Public data | Approximate headcount |
| `defenseNewsRank` | integer | Defense News | Rank in Top 100 |
| `totalRevenue` | real | Defense News | Total revenue (billions) |
| `defenseRevenue` | real | Defense News | Defense revenue (billions) |
| `defenseRevenuePercent` | real | Calculated | Percentage of defense revenue |
| `stockTicker` | string | Public data | Stock symbol (if public) |
| `isPublic` | boolean | Public data | Public vs. private |
| `website` | string | Public data | Company website URL |
| `careersUrl` | string | Public data | Careers page URL |
| `linkedinUrl` | string | Public data | LinkedIn company page |
| `wikipediaUrl` | string | Public data | Wikipedia article URL |
| `logoUrl` | string | Manual | Company logo path |
| `createdAt` | timestamp | — | Record creation |
| `updatedAt` | timestamp | — | Last update |

### specialty

| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Primary key |
| `slug` | string | URL-friendly identifier |
| `name` | string | Display name (e.g., "Cybersecurity") |
| `description` | text | What this specialty includes |
| `icon` | string | Iconify icon identifier |

**Specialty Taxonomy:**
- Aerospace & Defense
- Cybersecurity & IT
- Intelligence & Analytics
- Land Systems
- Naval & Maritime
- Space Systems
- Professional Services
- Logistics & Support
- Electronics & Sensors
- Research & Development

### claimedProfile

| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Primary key |
| `contractorId` | string | FK to contractor (unique) |
| `userId` | string | FK to user who claimed |
| `tier` | enum | 'claimed' / 'premium' / 'enterprise' |
| `status` | enum | 'pending' / 'active' / 'suspended' |
| `verifiedAt` | timestamp | When claim was verified |
| `verificationMethod` | enum | 'email_domain' / 'manual' / 'document' |

### employerBenefit / employerProgram / employerTestimonial

Structured content tables for claimed profiles. See schema for full details.

---

## 8. Claimed Profiles System

### Overview

Employers can claim their company profile to:
- Display a "Verified Employer" badge
- Edit profile content (description, links, locations)
- Add "Why Work Here" benefits
- Showcase notable programs/products
- Add spotlight content and testimonials (Premium)
- View profile analytics

### Tier Structure

| Feature | Free | Claimed ($149/mo) | Premium ($399/mo) |
|---------|------|-------------------|-------------------|
| Basic profile | Yes | Yes | Yes |
| Edit description, links | No | Yes | Yes |
| Upload logo | No | Yes | Yes |
| Verified badge | No | Yes | Yes |
| Add locations | No | Yes | Yes |
| "Why Work Here" section | No | Yes | Yes |
| Notable programs | No | Yes | Yes |
| Analytics dashboard | No | Yes | Yes |
| Spotlight content | No | No | Yes |
| Employee testimonials | No | No | Yes |
| Priority in search | No | No | Yes |

### Claim Flow

1. Employer visits `/for-employers` landing page
2. Clicks "Claim Your Profile" → `/profile-manager/claim`
3. Searches for their company
4. Verifies identity (email domain match or manual review)
5. Selects tier and completes payment
6. Gains access to `/profile-manager` dashboard

### Content Moderation

- Basic profile edits publish immediately
- Spotlight content and testimonials require admin approval
- Admin dashboard at `/admin` for reviewing claims and content

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
| Contractor profile | `/contractors/[slug]` | "[Company] contractor" | 48+ |
| Specialty browse | `/contractors/specialty/[slug]` | "[Specialty] defense contractors" | 10 |
| Location browse | `/contractors/location/[state]` | "defense contractors in [State]" | 50 |
| Top list | `/top-defense-contractors` | "top defense contractors" | 1 |

### Technical SEO

- **Structured data:** Organization schema on contractor pages
- **Internal linking:** Cross-link contractors by specialty, location
- **Fast loading:** Server-side rendering, edge caching
- **Mobile-first:** Responsive design

---

## 10. Roadmap

### Phase 1: Foundation (Complete)

| Task | Status |
|------|--------|
| Directory schema design | ✅ Done |
| Seed data from Defense News Top 100 (48 US companies) | ✅ Done |
| Contractor profile page | ✅ Done |
| Contractor browse/search | ✅ Done |
| Homepage redesign | ✅ Done |
| Specialty browse pages | ✅ Done |
| Location browse pages | ✅ Done |
| Top contractors page | ✅ Done |

### Phase 2: Monetization (Complete)

| Task | Status |
|------|--------|
| Claimed profiles schema | ✅ Done |
| Employer dashboard | ✅ Done |
| For-employers landing page | ✅ Done |
| Admin claim review | ✅ Done |
| Admin content review | ✅ Done |
| Profile enhancements (benefits, programs, spotlight) | ✅ Done |

### Phase 3: Growth (Future)

| Task | Status |
|------|--------|
| Expand to 200-300 contractors | 🔮 Future |
| USAspending contract data integration | 🔮 Future |
| Payment integration (Stripe) | 🔮 Future |
| Email verification for claims | 🔮 Future |
| Display advertising | 🔮 Future |

---

## 11. Success Metrics

### Traffic

| Metric | Phase 1 Target | Scale Target |
|--------|----------------|--------------|
| Monthly visitors | 1,000 | 25,000+ |
| Organic search traffic | 50% | 80%+ |
| Pages per session | 2+ | 3+ |

### SEO

| Metric | Target |
|--------|--------|
| Contractor pages indexed | 50+ |
| Top 10 rankings for "[company] contractor" | 25+ companies |
| Domain authority (Moz/Ahrefs) | 30+ |

### Revenue

| Metric | Target |
|--------|--------|
| Claimed profiles | 10+ |
| Monthly recurring revenue | $1,500+ |
| Premium tier adoption | 30% of claimed |

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **SEO competition** | Hard to rank | Focus on long-tail "[company] contractor" queries first |
| **Data accuracy** | User distrust | Multiple sources, clear "last updated" dates |
| **Low claim adoption** | No revenue | Focus on traffic first, then outreach to employers |
| **Competitor copies** | Reduced differentiation | Move fast, build domain authority |

---

## 13. Technical Stack

| Layer | Technology |
|-------|------------|
| Framework | Nuxt 4, Vue 3 |
| UI | TailwindCSS, shadcn-vue |
| Database | libSQL (SQLite), Drizzle ORM |
| Auth | Better Auth |
| Deployment | Coolify (VPS) |
| Testing | Vitest |

---

## Related Documentation

| Doc | Purpose |
|-----|---------|
| `.cursor/plans/` | Implementation plans |
| `AGENTS.md` | Cursor/agent conventions |
| `docs/` | Feature documentation |

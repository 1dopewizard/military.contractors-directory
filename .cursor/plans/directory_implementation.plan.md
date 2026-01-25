---
name: ""
overview: ""
todos: []
isProject: false
---

# Implementation Plan: Defense Contractor Directory

**Goal:** Transform military.contractors into the definitive directory of defense contractors.

**Timeline:** 4 phases, estimated 2-3 weeks total for Phase 1 (MVP).

---

## Phase 1: Foundation (MVP)

### 1.1 Database Schema

**Status:** `pending`

Create new schema for directory model. Keep existing schema files but add new ones.

**Files to create:**

- `server/database/schema/directory.ts` — New company schema for directory model

**Schema:**

```typescript
// companies table (expanded)
export const company = sqliteTable('company', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  founded: integer('founded'),
  headquarters: text('headquarters'),
  headquartersState: text('headquarters_state'),
  employeeCount: integer('employee_count'),
  employeeCountSource: text('employee_count_source'),
  revenue: integer('revenue'), // in millions USD
  stockTicker: text('stock_ticker'),
  isPublic: integer('is_public', { mode: 'boolean' }).default(false),
  website: text('website'),
  linkedinUrl: text('linkedin_url'),
  wikipediaUrl: text('wikipedia_url'),
  logoUrl: text('logo_url'),
  defenseNewsRank: integer('defense_news_rank'),
  totalContractValue: integer('total_contract_value'), // in millions USD
  contractCount: integer('contract_count'),
  topAgencies: text('top_agencies', { mode: 'json' }).$type<string[]>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// specialties taxonomy
export const specialty = sqliteTable('specialty', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
})

// company-specialty mapping
export const companySpecialty = sqliteTable('company_specialty', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text('company_id').notNull().references(() => company.id, { onDelete: 'cascade' }),
  specialtyId: text('specialty_id').notNull().references(() => specialty.id, { onDelete: 'cascade' }),
  isPrimary: integer('is_primary', { mode: 'boolean' }).default(false),
})

// company locations
export const companyLocation = sqliteTable('company_location', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text('company_id').notNull().references(() => company.id, { onDelete: 'cascade' }),
  city: text('city'),
  state: text('state').notNull(),
  isHeadquarters: integer('is_headquarters', { mode: 'boolean' }).default(false),
})
```

**Tasks:**

- [ ] Create `server/database/schema/directory.ts`
- [ ] Update `server/database/schema/index.ts` to export new tables
- [ ] Generate migration: `pnpm db:generate`
- [ ] Apply migration: `pnpm db:migrate`

---

### 1.2 Seed Data: Defense News Top 100

**Status:** `pending`

Create initial company list from Defense News Top 100.

**Data to collect manually (or semi-automated):**

1. Company name
2. Defense News rank (1-100)
3. Revenue (from Defense News)
4. Headquarters city/state
5. Website URL
6. Brief description (from Wikipedia lead paragraph)
7. Founded year (from Wikipedia)
8. Stock ticker (if public)
9. Wikipedia URL

**Files to create:**

- `scripts/seed/defense-news-top-100.json` — Raw data file
- `scripts/seed/seed-companies.ts` — Seed script

**Tasks:**

- [ ] Research and compile Defense News Top 100 data into JSON
- [ ] Create seed script to import data
- [ ] Run seed script to populate database
- [ ] Verify data in Drizzle Studio

---

### 1.3 Specialty Taxonomy

**Status:** `pending`

Define the specialty categories for classifying contractors.

**Specialties:**

1. `it-cybersecurity` — IT Services & Cybersecurity
2. `intelligence-analytics` — Intelligence & Analytics
3. `logistics-supply-chain` — Logistics & Supply Chain
4. `engineering-technical` — Engineering & Technical Services
5. `aerospace-defense-systems` — Aerospace & Defense Systems
6. `professional-services` — Professional Services & Consulting
7. `facilities-operations` — Facilities & Base Operations
8. `communications-electronics` — Communications & Electronics
9. `research-development` — Research & Development
10. `training-simulation` — Training & Simulation

**Tasks:**

- [ ] Create specialty seed data
- [ ] Seed specialties to database
- [ ] Manually categorize top 100 companies (or use LLM)

---

### 1.4 API Endpoints

**Status:** `pending`

Create API endpoints for directory data.

**Endpoints:**

- `GET /api/companies` — List all companies (paginated)
- `GET /api/companies/[slug]` — Get single company
- `GET /api/companies/search` — Search companies by name
- `GET /api/specialties` — List all specialties
- `GET /api/companies/specialty/[slug]` — Companies by specialty
- `GET /api/companies/location/[state]` — Companies by state

**Files to create:**

- `server/api/directory/companies/index.get.ts`
- `server/api/directory/companies/[slug].get.ts`
- `server/api/directory/companies/search.get.ts`
- `server/api/directory/specialties/index.get.ts`

**Tasks:**

- [ ] Create API endpoints
- [ ] Add pagination to list endpoints
- [ ] Add search functionality
- [ ] Test endpoints

---

### 1.5 Company Profile Page

**Status:** `pending`

Create the main company profile page.

**URL:** `/companies/[slug]`

**Sections:**

1. **Header:** Logo, name, tagline, key stats (employees, revenue, rank)
2. **Overview:** Description, founded, headquarters
3. **Key Facts:** Employee count, public/private, stock ticker
4. **Specialties:** Tags for areas of expertise
5. **External Links:** Website, LinkedIn, Wikipedia
6. **Contract Data:** Total contract value, top agencies (Phase 2)

**Files to create:**

- `app/pages/companies/[slug].vue`
- `app/components/Directory/CompanyHeader.vue`
- `app/components/Directory/CompanyOverview.vue`
- `app/components/Directory/CompanyFacts.vue`
- `app/components/Directory/CompanySpecialties.vue`
- `app/components/Directory/CompanyLinks.vue`

**Tasks:**

- [ ] Create company profile page
- [ ] Implement responsive layout
- [ ] Add structured data (schema.org Organization)
- [ ] Add meta tags for SEO

---

### 1.6 Company Browse Page

**Status:** `pending`

Create the main browse/search page.

**URL:** `/companies`

**Features:**

1. Search bar (company name)
2. Filter by specialty
3. Filter by state/location
4. Sort by: name, rank, employees, revenue
5. Card grid of companies

**Files to create:**

- `app/pages/companies/index.vue`
- `app/components/Directory/CompanyCard.vue`
- `app/components/Directory/CompanyFilters.vue`
- `app/components/Directory/CompanySearch.vue`

**Tasks:**

- [ ] Create browse page with filters
- [ ] Implement search functionality
- [ ] Create company card component
- [ ] Add pagination

---

### 1.7 Homepage Redesign

**Status:** `pending`

Redesign homepage for directory model.

**Sections:**

1. **Hero:** "The definitive directory of defense contractors"
2. **Search:** Prominent company search bar
3. **Browse by Specialty:** Grid of specialty categories
4. **Top Contractors:** Top 10 by Defense News rank
5. **Browse by Location:** Map or state list
6. **Stats:** "300 companies, 10 specialties, ..."

**Files to modify:**

- `app/pages/index.vue`

**Tasks:**

- [ ] Redesign homepage layout
- [ ] Add search bar component
- [ ] Add specialty browse section
- [ ] Add top contractors section

---

### 1.8 Navigation & Layout

**Status:** `pending`

Update site navigation for directory model.

**Nav items:**

- Home
- Companies (browse)
- By Specialty (dropdown)
- By Location (dropdown)
- About

**Tasks:**

- [ ] Update header navigation
- [ ] Create specialty dropdown
- [ ] Create location dropdown
- [ ] Update footer

---

## Phase 2: Enrichment

### 2.1 People Data Labs Integration

**Status:** `future`

Enrich company data with People Data Labs.

**Data to pull:**

- Accurate employee count
- All office locations
- Social media URLs
- Industry classifications

**Tasks:**

- [ ] Sign up for People Data Labs API
- [ ] Create enrichment script
- [ ] Run enrichment for all companies
- [ ] Update database with enriched data

---

### 2.2 USAspending Contract Data

**Status:** `future`

Add federal contract intelligence.

**Data to pull:**

- Total contract value by company
- Number of contracts
- Top awarding agencies
- Recent large awards

**Tasks:**

- [ ] Research USAspending API
- [ ] Create contract data pipeline
- [ ] Add contract section to company pages
- [ ] Create "Top Contractors by Contract Value" page

---

### 2.3 LLM Specialty Categorization

**Status:** `future`

Use LLM to categorize companies into specialties.

**Approach:**

1. Pull company descriptions
2. Send to Claude/GPT with specialty taxonomy
3. Get primary and secondary specialty assignments
4. Review and correct manually

**Tasks:**

- [ ] Create LLM categorization script
- [ ] Run categorization for all companies
- [ ] Manual review and correction
- [ ] Update database

---

### 2.4 Expand to 200-300 Companies

**Status:** `future`

Add companies beyond Defense News Top 100.

**Sources:**

- Washington Technology Top 100
- USAspending top recipients
- Notable specialists

**Tasks:**

- [ ] Compile additional company list
- [ ] Research and add data
- [ ] Enrich with PDL
- [ ] Categorize specialties

---

## Phase 3: SEO & Content

### 3.1 Specialty Browse Pages

**Status:** `future`

Create dedicated pages for each specialty.

**URL:** `/companies/specialty/[slug]`

**Content:**

- Specialty description
- Companies in this specialty
- Related specialties

**Tasks:**

- [ ] Create specialty page template
- [ ] Generate pages for all specialties
- [ ] Add internal linking

---

### 3.2 Location Browse Pages

**Status:** `future`

Create dedicated pages for each state.

**URL:** `/companies/location/[state]`

**Content:**

- State overview
- Companies headquartered or with offices in state
- Map visualization (optional)

**Tasks:**

- [ ] Create location page template
- [ ] Generate pages for all states with companies
- [ ] Add internal linking

---

### 3.3 Top Lists Pages

**Status:** `future`

Create SEO-focused list pages.

**Pages:**

- `/top-defense-contractors` — Overall top 100
- `/top-cybersecurity-contractors` — By specialty
- `/largest-defense-contractors` — By employee count

**Tasks:**

- [ ] Create list page template
- [ ] Generate key list pages
- [ ] Add structured data for lists

---

### 3.4 Structured Data & Meta Tags

**Status:** `future`

Optimize for rich search results.

**Schema.org types:**

- Organization (company pages)
- ItemList (browse pages)
- WebSite (homepage)

**Tasks:**

- [ ] Add Organization schema to company pages
- [ ] Add ItemList schema to browse pages
- [ ] Verify with Google Rich Results Test
- [ ] Add Open Graph tags

---

## Phase 4: Growth & Monetization

### 4.1 Claimed Employer Profiles

**Status:** `future`

Allow companies to claim and manage their profiles.

### 4.2 Advertising Integration

**Status:** `future`

Add display advertising for revenue.

### 4.3 Featured Placements

**Status:** `future`

Allow companies to pay for featured placement.

---

## Data Collection Checklist

### Defense News Top 100 Data Points

For each company, collect:

- [ ] Name
- [ ] Defense News rank (2024)
- [ ] Defense revenue (millions)
- [ ] Total revenue (millions)
- [ ] Headquarters city
- [ ] Headquarters state
- [ ] Website URL
- [ ] Wikipedia URL (if exists)
- [ ] LinkedIn URL
- [ ] Stock ticker (if public)
- [ ] Founded year
- [ ] Brief description (1-2 sentences)
- [ ] Primary specialty (manual categorization)
- [ ] Secondary specialties (if applicable)

---

## File Structure (New/Modified)

```
apps/contractors/
├── app/
│   ├── components/
│   │   └── Directory/
│   │       ├── CompanyCard.vue
│   │       ├── CompanyFacts.vue
│   │       ├── CompanyFilters.vue
│   │       ├── CompanyHeader.vue
│   │       ├── CompanyLinks.vue
│   │       ├── CompanyOverview.vue
│   │       ├── CompanySearch.vue
│   │       └── CompanySpecialties.vue
│   └── pages/
│       ├── index.vue (modified)
│       └── companies/
│           ├── index.vue (browse)
│           ├── [slug].vue (profile)
│           ├── specialty/
│           │   └── [slug].vue
│           └── location/
│               └── [state].vue
├── server/
│   ├── api/
│   │   └── directory/
│   │       ├── companies/
│   │       │   ├── index.get.ts
│   │       │   ├── [slug].get.ts
│   │       │   └── search.get.ts
│   │       └── specialties/
│   │           └── index.get.ts
│   └── database/
│       └── schema/
│           └── directory.ts (new)
└── scripts/
    └── seed/
        ├── defense-news-top-100.json
        ├── specialties.json
        └── seed-directory.ts
```

---

## Immediate Next Steps

1. **Create directory schema** — Define tables, generate migration
2. **Seed specialties** — Add the 10 specialty categories
3. **Start data collection** — Begin compiling Defense News Top 100 data
4. **Create company profile page** — Build the core page template
5. **Create browse page** — Build the company listing page

---

## Open Questions

1. **Logo sourcing:** Use Clearbit Logo API, or collect manually?
2. **MOS integration:** Keep any MOS data on company pages, or remove entirely?
3. **Existing data:** Migrate any existing company data, or start fresh?
4. **URL structure:** Keep `/companies/[slug]` or change to `/contractor/[slug]`?

---

## Dependencies

- Defense News Top 100 list (2024) — need to source
- People Data Labs account — for enrichment (Phase 2)
- USAspending API access — free, no signup needed
- OpenAI/Claude API — for specialty categorization

---

## Success Criteria (Phase 1 Complete)

- [ ] 100 company profiles with basic data
- [ ] Company profile page rendering correctly
- [ ] Browse page with search and filters working
- [ ] Homepage redesigned for directory model
- [ ] All companies categorized by specialty
- [ ] Basic SEO (meta tags, structured data) in place
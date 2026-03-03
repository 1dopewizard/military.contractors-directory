---
name: Directory Rewrite with Mock Data
overview: Complete rewrite of military.contractors as a U.S. defense contractor directory. Use GPT-5.1 to generate realistic mock data for 48 U.S. companies from the Defense News Top 100. Keep advertising and jobs code for future re-integration.
todos:
  - id: schema
    content: Create server/database/schema/directory.ts with contractor, specialty, contractorSpecialty, contractorLocation tables
    status: completed
  - id: schema-index
    content: Update server/database/schema/index.ts to export new directory tables
    status: completed
  - id: migration
    content: Generate and apply database migration
    status: completed
  - id: mock-script
    content: Create scripts/seed/generate-mock-contractors.ts to call GPT-5.1 for each company
    status: completed
  - id: mock-data
    content: Run mock generation script to create scripts/seed/mock-contractors.json
    status: completed
  - id: seed-script
    content: Create scripts/seed/seed-contractors.ts to import mock data
    status: completed
  - id: api-list
    content: Create server/api/contractors/index.get.ts (paginated list with filters)
    status: completed
  - id: api-single
    content: Create server/api/contractors/[slug].get.ts (single contractor)
    status: completed
  - id: api-specialties
    content: Create server/api/specialties/index.get.ts (list specialties)
    status: completed
  - id: page-profile
    content: Create app/pages/contractors/[slug].vue (company profile page)
    status: completed
  - id: page-browse
    content: Create app/pages/contractors/index.vue (browse/search page)
    status: completed
  - id: page-home
    content: Redesign app/pages/index.vue for directory model
    status: completed
  - id: cleanup
    content: Remove old MOS and company code after new system works (keep jobs for future)
    status: completed
isProject: false
---

# Defense Contractor Directory Rewrite

## Overview

Transform military.contractors from a MOS-matching job board into a comprehensive U.S. defense contractor directory. Generate realistic mock data for 48 U.S. companies from the Defense News Top 100 using GPT-5.1, enabling UI development before real data collection.

**Key Decisions:**

- **U.S. Only:** Filter to U.S.-based contractors only (48 companies). Excludes Chinese, European, and other international companies.
- **Jobs Feature:** Keep schema and API for future re-integration. Remove from UI/navigation for now.
- **URL Structure:** Use `/contractors/[slug]` for SEO alignment with "military.contractors" domain.

---

## Phase 1: Schema and Data Model

### 1.1 New Directory Schema

Create `server/database/schema/directory.ts` with these tables:

**contractor table** (core company data):

- `id`, `slug`, `name` (required)
- `description` - 2-3 paragraph company overview
- `defenseNewsRank` - 2025 rank (1-100)
- `country` - from Top 100 list
- `headquarters` - city, state/country
- `founded` - year
- `employeeCount` - approximate headcount
- `website`, `careersUrl`, `linkedinUrl`, `wikipediaUrl`
- `stockTicker` - if public
- `isPublic` - boolean
- `totalRevenue` - 2024 total revenue (from list)
- `defenseRevenue` - 2024 defense revenue (from list)
- `defenseRevenuePercent` - percentage (from list)
- `logoUrl`
- `createdAt`, `updatedAt`

**specialty table** (taxonomy):

- `id`, `slug`, `name`, `description`, `icon`

**contractorSpecialty table** (many-to-many):

- `contractorId`, `specialtyId`, `isPrimary`

**contractorLocation table** (office locations):

- `contractorId`, `city`, `state`, `country`, `isHeadquarters`

### 1.2 Specialty Taxonomy

10 categories for classifying contractors:

1. `aerospace-defense` - Aircraft, missiles, satellites
2. `cybersecurity-it` - Cyber, IT services, cloud
3. `intelligence-analytics` - Intel, data analytics, AI/ML
4. `land-systems` - Vehicles, weapons, munitions
5. `naval-maritime` - Ships, submarines, maritime systems
6. `space-systems` - Satellites, launch, space tech
7. `professional-services` - Consulting, engineering services
8. `logistics-support` - Base ops, supply chain, MRO
9. `electronics-sensors` - Sensors, communications, EW
10. `research-development` - FFRDCs, labs, R&D

---

## Phase 2: Mock Data Generation with GPT-5.1

### 2.1 U.S. Companies from Top 100

Filter the Defense News Top 100 to U.S.-only companies (48 total):

Lockheed Martin (#1), RTX (#2), Northrop Grumman (#4), General Dynamics (#5), Boeing (#7), L3Harris (#9), Leidos (#15), HII (#16), Amentum (#17), Booz Allen Hamilton (#19), CACI (#20), GE Aerospace (#23), Honeywell (#24), KBR (#30), Advanced Technology International (#33), Peraton (#34), Parsons (#39), SpaceX (#40), V2X (#41), SAIC (#42), Textron (#45), TransDigm (#46), Bechtel (#48), Oshkosh (#56), BWX Technologies (#58), Viasat (#61), Sierra Nevada (#63), Parker Hannifin (#65), Curtiss-Wright (#66), Amphenol (#68), Palantir (#70), MITRE (#73), Moog (#74), ManTech (#75), HEICO (#76), Howmet Aerospace (#81), Aerospace Corporation (#83), Keysight (#85), TTM Technologies (#86), Teledyne (#89), StandardAero (#90), Kratos (#91), Spirit AeroSystems (#92), Anduril (#93), M1 Support Services (#94), Mercury Systems (#96), AM General (#99), Hexcel (#100)

### 2.2 Data Fields to Generate

For each U.S. company, GPT-5.1 will generate:

**From the Defense News list (provided):**

- `name`, `defenseNewsRank`, `country`
- `totalRevenue`, `defenseRevenue`, `defenseRevenuePercent`

**Generated by GPT-5.1:**

- `slug` - URL-safe version of name
- `description` - 2-3 paragraphs about the company, what they do, their history
- `headquarters` - realistic city/state based on company
- `founded` - year founded
- `employeeCount` - approximate (e.g., "45,000")
- `website` - official website URL
- `careersUrl` - careers page URL
- `linkedinUrl` - LinkedIn company page
- `wikipediaUrl` - Wikipedia article if exists
- `stockTicker` - if public company
- `isPublic` - boolean
- `specialties` - 1-3 specialty slugs from taxonomy
- `keyProducts` - 3-5 notable products/programs
- `notableContracts` - 2-3 major contract wins

### 2.3 Generation Script

Create `scripts/seed/generate-mock-contractors.ts`:

1. Read the Top 100 list from `docs/top_100_defense_contractors.md`
2. Filter to U.S. companies only
3. Parse into structured data
4. For each U.S. company, call GPT-5.1 API with prompt including:
   - Company name, rank, country, revenue data
   - Specialty taxonomy for classification
   - Output schema (JSON)

5. Validate and save to `scripts/seed/mock-contractors.json`
6. Create seed script to import into database

### 2.4 GPT-5.1 Prompt Structure

```
You are generating realistic mock data for a defense contractor directory.

Company: {name}
Rank: {rank} on Defense News Top 100 (2025)
Country: {country}
Total Revenue (2024): {totalRevenue}
Defense Revenue (2024): {defenseRevenue}

Generate realistic data for this company. Use your knowledge of real defense contractors to create plausible:
- Description (2-3 paragraphs about what they do)
- Headquarters location
- Founded year
- Employee count
- Website/careers/LinkedIn/Wikipedia URLs
- Stock ticker (if public)
- Primary and secondary specialties from: [taxonomy list]
- Key products/programs (3-5)
- Notable contracts (2-3)

Return as JSON matching this schema: {...}
```

---

## Phase 3: Company Page Design

### 3.1 Company Profile Page (`/contractors/[slug]`)

**Header Section:**

- Company name (h1)
- Defense News rank badge (#1, #2, etc.)
- Primary specialty tag

**Key Stats Row:**

- Defense Revenue: $X.XB
- Total Revenue: $X.XB
- % Defense: XX%
- Employees: ~XX,000
- Founded: YYYY
- HQ: City, State

**Overview Section:**

- Full description (2-3 paragraphs)
- Key products/programs list
- Notable contracts

**Sidebar:**

- External links (Website, Careers, LinkedIn, Wikipedia)
- Stock info: Display "Public · NYSE: LMT" with link to Yahoo Finance, or "Private" for non-public companies. No live price data - just static ticker symbol.
- Specialties tags
- Related contractors (same specialty)

### 3.2 Browse Page (`/contractors`)

**Features:**

- Search by company name
- Filter by specialty (dropdown)
- Sort by: Rank, Revenue, Name
- Card grid showing: name, rank, revenue, primary specialty

### 3.3 Homepage

**Sections:**

- Hero: "The Defense Contractor Directory"
- Search bar (prominent)
- Top 10 contractors grid
- Browse by Specialty (icon grid)
- Stats: "48 U.S. contractors, 10 specialties, $XXB defense revenue"

---

## Phase 4: Code Cleanup

### 4.1 Files to Keep

**Advertising (monetization):**

- `server/database/schema/campaigns.ts` - all tables
- `server/api/ads/*` - all endpoints
- Related components for displaying ads

**Infrastructure:**

- `server/database/index.ts` - DB connection
- `server/utils/` - auth, logger, embeddings
- `nuxt.config.ts`, `drizzle.config.ts`
- UI library components (shadcn-vue)

### 4.2 Files to Remove

**MOS-related (no longer needed):**

- `server/database/schema/mos.ts`
- `server/api/mos/*`
- `app/pages/search.vue` (MOS search)
- MOS-related components
- MOS seed scripts

**Old company system:**

- `server/database/schema/companies.ts` (replaced by directory.ts)
- `app/pages/companies/*` (replaced by /contractors)
- Old company components

**Jobs system (KEEP for future re-integration):**

- `server/database/schema/jobs.ts` - KEEP
- `server/api/jobs/*` - KEEP
- Job-related pages/components - remove from UI/nav, keep code

### 4.3 Tables to Evaluate

Keep advertising tables:

- `campaign`, `toast_ad`, `toast_ad_event`
- `featured_employer`, `featured_listing`
- `sponsored_ad`, `sponsored_job`

Keep auth:

- `user`, `session`, `account`

Keep for future:

- `job`, `pipeline_job` - keep for future jobs re-integration

Remove:

- `mos_code`, `job_mos_mapping`, `mos_job_ranking`
- `company`, `company_mos` (replaced by new schema)

---

## Phase 5: Implementation Order

1. **Schema first** - Create directory.ts, generate migration
2. **Mock data generation** - Script to call GPT-5.1, generate JSON
3. **Seed database** - Import mock data
4. **API endpoints** - contractors list, single, search, specialties
5. **Company profile page** - Full page with all sections
6. **Browse page** - Grid with filters
7. **Homepage redesign** - Directory-focused
8. **Cleanup** - Remove old code after new system works

---

## Key Files

| Purpose | Path |

|---------|------|

| New schema | `server/database/schema/directory.ts` |

| Mock data generation | `scripts/seed/generate-mock-contractors.ts` |

| Generated mock data | `scripts/seed/mock-contractors.json` |

| Seed script | `scripts/seed/seed-contractors.ts` |

| Company list source | `docs/top_100_defense_contractors.md` |

| Contractor profile page | `app/pages/contractors/[slug].vue` |

| Browse page | `app/pages/contractors/index.vue` |

---

## Decisions Made

1. **U.S. Only:** Focus on 48 U.S. contractors. Excludes Chinese state-owned companies (CASIC, NORINCO, CSSC) and European/international contractors. Can expand internationally later.
2. **Jobs Feature:** Keep database schema and API endpoints for future re-integration. Remove jobs from UI/navigation for initial launch.
3. **URL Structure:** Use `/contractors/[slug]` for better SEO alignment with "military.contractors" domain and "defense contractors" search terms.

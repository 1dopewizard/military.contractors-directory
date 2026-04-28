# military.contractors

Open intelligence on U.S. defense contractors.

## What This Is

`military.contractors` is a public contractor intelligence directory for researching U.S. defense companies, public award activity, agencies, NAICS/PSC categories, locations, and spending trends.

The product is not a job board, MOS translation tool, staffing marketplace, or career alert platform. Public surfaces now focus on source-backed contractor intelligence.

## Current Product Pillars

1. **Contractor Directory**: structured company profiles with specialties, headquarters, locations, revenue context, identifiers, and source links.
2. **Award Intelligence**: live USAspending award records, obligation totals, agency/category rollups, and yearly trends.
3. **Explorer**: plain-English questions routed through strict structured plans, deterministic backend operations, persistent cache, and source links.
4. **Indexable Intelligence**: agency, NAICS, PSC, topic, ranking, comparison, and company profile pages.
5. **Data Quality Operations**: admin tooling for contractor records, source freshness, and intelligence cache review.

## Pages

| Page | URL | Description |
| --- | --- | --- |
| Homepage | `/` | Contractor intelligence explorer, top contractors, and specialty browsing |
| Explorer | `/explorer` | Full research workbench with follow-up modes |
| Compare | `/compare` | Compare two to four contractors |
| Companies | `/companies` | Browse defense contractors by name, specialty, location, and revenue |
| Company Profile | `/companies/[slug]` | Contractor profile with intelligence panels and public award context |
| Agencies | `/agencies`, `/agencies/[agencySlug]` | Agency contractor rankings and award examples |
| Categories | `/categories/naics/[code]`, `/categories/psc/[code]` | NAICS and PSC contractor rankings |
| Topics | `/topics/[topicSlug]` | Topic-driven award intelligence pages |
| Rankings | `/rankings/[presetSlug]` | Preset contractor rankings |
| By Specialty | `/companies/specialty/[slug]` | Contractor category pages |
| By Location | `/companies/location/[state]` | Contractor location pages |
| Admin | `/admin` | Admin dashboard |
| Login | `/auth/login` | Magic link auth |
| About | `/about` | Product explanation |
| Contact | `/contact` | Contact form |
| Privacy | `/privacy` | Privacy policy |
| Terms | `/terms` | Terms of service |

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Nuxt 4 |
| UI | Tailwind CSS v4, shadcn-vue |
| Database | Drizzle ORM + libsql (SQLite) |
| Auth | Better Auth |
| Validation | Zod + vee-validate |
| Icons | Iconify (MDI) |
| Logging | pino |
| Testing | Vitest |
| Deployment | Coolify (VPS) |

## Repository Layout

```text
military.contractors/
├── app/
│   ├── components/              # Vue components and shadcn-vue wrappers
│   ├── composables/             # useAuth, useJsonLd, useLogger
│   ├── layouts/                 # default, homepage, dashboard
│   └── pages/                   # public pages and dashboards
├── server/
│   ├── api/
│   │   ├── contractors/         # Directory API
│   │   ├── explorer/            # Intelligence explorer API
│   │   ├── intelligence/        # Public award intelligence API
│   │   └── admin/               # Admin and intelligence maintenance API
│   ├── database/
│   │   ├── migrations/          # Drizzle/libsql migrations
│   │   └── schema/              # Drizzle schema files
│   ├── routes/                  # Sitemap, auth handler
│   └── utils/                   # DB, auth, intelligence, logging
├── docs/
│   └── open-contractor-intelligence-pivot-plan.md
├── scripts/
│   └── seed/                    # Seed data and scripts
├── prd.md
└── package.json
```

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Create `.env`:

```env
DATABASE_URL=file:./server/database/app.db
BETTER_AUTH_SECRET=your-secret-here
RESEND_API_KEY=
NUXT_PUBLIC_SITE_URL=https://military.contractors
```

### 3. Set up database

```bash
pnpm db:migrate
pnpm tsx scripts/seed/seed-contractors.ts
```

### 4. Run development server

```bash
pnpm dev
```

### 5. Build for production

```bash
pnpm build && pnpm start
```

## API Endpoints

### Contractor Directory

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/contractors` | Paginated contractor list with filters |
| GET | `/api/contractors/[slug]` | Contractor detail |
| GET | `/api/contractors/by-location/[state]` | Contractors by state |
| GET | `/api/specialties` | All specialties |
| GET | `/api/specialties/[slug]` | Specialty detail |
| GET | `/api/locations` | Location list |

### Intelligence

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/intelligence/contractors/[slug]` | Contractor award intelligence |
| GET | `/api/intelligence/top-contractors` | Ranked contractors by public obligations |
| GET | `/api/intelligence/recipients/resolve` | Resolve recipient names and UEIs |
| GET | `/api/intelligence/awards` | Search award rows |
| GET | `/api/intelligence/awards/[awardKey]` | Award detail |
| GET | `/api/intelligence/agencies` | Agency reference list |
| GET | `/api/intelligence/agencies/[agencySlug]` | Agency intelligence |
| GET | `/api/intelligence/categories/[kind]/[code]` | NAICS/PSC intelligence |
| GET | `/api/intelligence/topics/[topicSlug]` | Topic intelligence |
| GET | `/api/intelligence/rankings/[presetSlug]` | Ranking preset data |
| POST | `/api/explorer/query` | Structured plain-English explorer query |
| POST | `/api/explorer/follow-up` | Refine, pivot, or answer from cached results |
| GET | `/api/explorer/cache/[cacheId]` | Cached explorer result |

## SEO

- SSR on public pages.
- Dynamic sitemap for companies, agencies, categories, rankings, topics, specialties, and locations.
- Schema.org: WebSite, WebPage, Organization, CollectionPage, BreadcrumbList, Dataset-ready intelligence pages.
- Unique meta tags and canonical URLs on key pages.
- Public source links are prominent on intelligence surfaces.

## Documentation

| Document | Purpose |
| --- | --- |
| `prd.md` | Product requirements and roadmap |
| `docs/open-contractor-intelligence-pivot-plan.md` | Pivot execution plan |

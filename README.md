# military.contractors

Open intelligence on U.S. defense contractors.

## What This Is

`military.contractors` is a public contractor intelligence directory for researching U.S. defense companies, public award activity, agencies, NAICS/PSC categories, locations, and spending trends.

The product is no longer positioned as a job board, MOS translation tool, or career alert platform. Job, MOS, alert, and OCONUS code paths that remain in the repository are legacy compatibility surfaces unless they support contractor intelligence.

## Current Product Pillars

1. **Contractor Directory**: structured company profiles with specialties, headquarters, locations, revenue context, identifiers, and source links.
2. **Award Intelligence**: USAspending-shaped award records, obligation totals, agency/category rollups, and yearly trends.
3. **Explorer**: plain-English questions routed through strict structured plans and deterministic backend operations.
4. **Claimed Profiles**: existing profile claim/admin infrastructure remains available, but it is not the v1 monetization focus.

## Pages

| Page | URL | Description |
| --- | --- | --- |
| Homepage | `/` | Contractor intelligence explorer, top contractors, and specialty browsing |
| Companies | `/companies` | Browse defense contractors by name, specialty, location, and revenue |
| Company Profile | `/companies/[slug]` | Contractor profile with intelligence panels and public award context |
| By Specialty | `/companies/specialty/[slug]` | Contractor category pages |
| By Location | `/companies/location/[state]` | Contractor location pages |
| For Companies | `/for-companies` | Claimed profile information |
| Profile Manager | `/profile-manager` | Claimed profile dashboard |
| Claim Profile | `/profile-manager/claim` | Claim flow |
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
| Billing | Stripe |
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
│   │   └── profile-manager/     # Claimed profile API
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
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CLAIMED_PRICE_ID=
STRIPE_PREMIUM_PRICE_ID=
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
| POST | `/api/explorer/query` | Structured plain-English explorer query |
| GET | `/api/explorer/cache/[cacheId]` | Cached explorer result |

### Profile Manager

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/profile-manager/claim` | Submit claim |
| GET | `/api/profile-manager/profile` | Get profile |
| PATCH | `/api/profile-manager/profile` | Update profile |
| GET/POST | `/api/profile-manager/benefits` | Manage profile highlights |
| GET/POST | `/api/profile-manager/programs` | Manage notable programs |

## SEO

- SSR on public pages.
- Dynamic sitemap for companies, specialties, and locations.
- Schema.org: WebSite, WebPage, Organization, CollectionPage, BreadcrumbList, Dataset-ready intelligence pages.
- Unique meta tags and canonical URLs on key pages.
- Public source links are prominent on intelligence surfaces.

## Documentation

| Document | Purpose |
| --- | --- |
| `prd.md` | Product requirements and roadmap |
| `docs/open-contractor-intelligence-pivot-plan.md` | Pivot execution plan |

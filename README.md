# military.contractors

Defense contractor intelligence platform -- company directory, industry insights, claimed profiles SaaS, and staffing pipeline.

## What this is

1. **Defense Contractor Directory** -- 103+ company profiles with specialties, locations, revenue data, and employer-managed claimed profiles
2. **Industry Insights** -- Timely analysis on hiring surges, contractor pay, MOS demand, and career strategy
3. **Claimed Profiles SaaS** -- Employers claim and enhance their company pages ($149-$399/month)
4. **Job Alerts** -- Email subscriptions for job notifications by MOS and specialty

## Revenue Model

- **Claimed profiles:** $149-$399/month SaaS for employers
- **Placement fees:** $10K-$50K per successful hire (future)
- **Sponsored listings:** $299-$999/month featured jobs (future)

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Homepage | `/` | Search + top contractors + browse by specialty |
| Companies | `/companies` | Browse 103+ defense contractors |
| Company Profile | `/companies/[slug]` | Full company profile |
| By Specialty | `/companies/specialty/[slug]` | 10 specialty categories |
| By Location | `/companies/location/[state]` | 16+ states |
| Insights Hub | `/insights` | Industry analysis articles |
| Hiring Surge | `/insights/defense-hiring-surge-2026` | Iran conflict analysis |
| Contractors Hiring | `/insights/contractors-hiring-now` | Company breakdown |
| MOS Demand | `/insights/mos-demand-middle-east` | In-demand specialties |
| Pay & Tax Guide | `/insights/contractor-pay-tax-guide` | Compensation guide |
| For Companies | `/for-companies` | Claimed profiles pricing |
| Profile Manager | `/profile-manager` | Employer dashboard |
| Claim Profile | `/profile-manager/claim` | Claim flow |
| Admin | `/admin` | Admin dashboard |
| Login | `/auth/login` | Magic link auth |
| About | `/about` | Services page |
| Contact | `/contact` | Contact form |
| Privacy | `/privacy` | Privacy policy |
| Terms | `/terms` | Terms of service |

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Nuxt 4 |
| UI | Tailwind CSS v4, shadcn-vue |
| Database | Drizzle ORM + libsql (SQLite) |
| Auth | Better Auth (magic link via Resend) |
| Billing | Stripe |
| Validation | Zod + vee-validate |
| Email | Resend |
| Icons | Iconify (MDI) |
| Logging | pino |
| Analytics | Plausible |
| Testing | Vitest |
| Deployment | Coolify (VPS) |

## Repository layout

```
military.contractors/
├── app/
│   ├── components/
│   │   ├── Auth/                 # Login, auth button
│   │   ├── Contractors/          # Company cards, skeletons
│   │   ├── Dashboard/
│   │   │   ├── Admin/            # Admin dashboard components
│   │   │   └── ProfileManager/   # Employer dashboard
│   │   ├── Featured/             # Alert signup, featured cards
│   │   ├── Layout/               # Page layout, search
│   │   └── ui/                   # shadcn-vue (auto-imported)
│   ├── composables/              # useAuth, useJsonLd, useLogger
│   ├── config/                   # Auth config
│   ├── layouts/                  # default, homepage, dashboard
│   ├── lib/                      # Auth client, utils
│   ├── middleware/                # auth, admin, profile-manager
│   └── pages/
│       ├── admin/                # Admin dashboard
│       ├── auth/                 # Login, callback
│       ├── companies/            # Contractor directory
│       ├── for-companies/        # Pricing page
│       ├── insights/             # Industry analysis
│       ├── profile-manager/      # Employer dashboard
│       └── ...                   # Static pages
├── server/
│   ├── api/
│   │   ├── admin/                # Admin endpoints
│   │   ├── alerts/               # Job alert subscriptions
│   │   ├── billing/              # Stripe integration
│   │   ├── contractors/          # Directory API
│   │   ├── locations/            # Location API
│   │   ├── profile-manager/      # Claimed profiles
│   │   ├── specialties/          # Specialty API
│   │   └── users/                # User endpoints
│   ├── database/
│   │   └── schema/               # Drizzle schema files
│   ├── routes/                   # Sitemap, auth handler
│   └── utils/                    # DB, email, auth, stripe, logging
├── scripts/
│   └── seed/                     # Seed data + scripts
├── prd.md                        # Product requirements
└── package.json
```

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Create `.env`:

```
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

## API endpoints

### Contractor Directory

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/contractors | Paginated list with filters |
| GET | /api/contractors/[slug] | Contractor detail |
| GET | /api/contractors/by-location/[state] | By state |
| GET | /api/specialties | All specialties |
| GET | /api/specialties/[slug] | Specialty detail |
| GET | /api/locations | Location list |

### Billing

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/billing/create-checkout | Stripe checkout |
| POST | /api/billing/webhook | Stripe webhooks |
| GET | /api/billing/portal | Customer portal |

### Profile Manager

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/profile-manager/claim | Submit claim |
| GET | /api/profile-manager/profile | Get profile |
| PATCH | /api/profile-manager/profile | Update profile |
| GET/POST | /api/profile-manager/benefits | Manage benefits |
| GET/POST | /api/profile-manager/programs | Manage programs |

### Admin

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/admin/system-health | System metrics |
| GET/PATCH | /api/admin/claims | Claim review |
| GET/PATCH | /api/admin/content | Content review |
| GET | /api/admin/users | User management |

### Alerts

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/alerts/subscribe | Subscribe |
| GET | /api/alerts/unsubscribe | Unsubscribe |

### Other

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/search | Global search |
| GET | /sitemap.xml | Dynamic sitemap |

## SEO

- SSR on all public pages
- 130+ URLs in dynamic sitemap
- Schema.org: WebSite, WebPage, Organization, Article, CollectionPage, BreadcrumbList
- Unique meta tags, OG tags, canonical URLs on every page
- 2 content silos: /companies (103+), /insights (5+)
- Plausible analytics (privacy-friendly, no cookie banner)

## Documentation

| Document | Purpose |
|----------|---------|
| prd.md | Product requirements and roadmap |

See `prd.md` for full product requirements.

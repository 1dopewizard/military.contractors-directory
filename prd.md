# PRD -- military.contractors

## 1. Summary

**Product:** Military contracting career intelligence platform -- MOS career mapping, defense contractor directory, staffing placement pipeline, and industry insights.

**Three revenue streams:**

1. **Placement fees** ($10K-$50K per successful hire)
2. **Claimed profiles SaaS** ($149-$399/month per employer)
3. **Sponsored job listings** ($299-$999/month, future)

**SEO surface:** 1,500+ indexable URLs across 4 content silos (/companies, /insights, /jobs, /mos).

---

## 2. Vision & Strategic Context

Operation Epic Fury (launched February 28, 2026) and the resulting Iran conflict have created the largest defense spending surge since the Iraq War. The FY2026 defense budget of $858.9B is enacted, with $1.5T proposed for FY2027 -- a 74.6% year-over-year increase.

Defense contractor stocks surged 5-11% in the first days of the conflict. PMCs are hiring aggressively (Constellis alone has 258+ active postings). Iran operations burn approximately $200M/day.

military.contractors sits on an exact-match domain with a production-ready contractor directory, auth system, admin dashboard, and claimed profiles SaaS. The surge content strategy (insights silo) captures timely search traffic while the directory provides long-term platform value beyond any single conflict.

---

## 3. Competitive Landscape

| Competitor | Focus | Weakness |
|---|---|---|
| Wikipedia | General encyclopedia | Only covers major contractors; not structured for comparison |
| Crunchbase | Startups, tech companies | Weak defense coverage; tech-focused |
| Bloomberg Government | Federal contracting intel | Paywalled; enterprise pricing |
| GovWin | Contract opportunities | BD-focused; not company profiles |
| LinkedIn | Professional network | No defense specialization |
| ClearanceJobs | Cleared job board | Job-focused, no company directory |
| Silent Professionals | SOF/PMC jobs | Niche, no company intelligence |

**Our position:** The only platform combining defense contractor directory + industry insights + claimed profiles SaaS on an exact-match domain.

---

## 4. User Personas

### Veteran Career Researcher
Enters company name or browses by specialty, researches potential employers, compares companies by size, revenue, specialties, and locations.

### Active Job Seeker
Reads insights articles, researches specific companies, explores contractor hiring data, uses platform to inform their job search strategy.

### Employer (HR/Recruiting)
Claims company profile, manages presence, adds benefits/programs/testimonials, monitors profile analytics, pays for enhanced visibility.

### Industry Professional
Researchers competitors, partners, or acquisition targets. Uses directory for quick reference on company basics.

---

## 5. Site Architecture

### 4 Content Silos

| Silo | URL Pattern | Page Count | Purpose |
|---|---|---|---|
| Companies | `/companies/*` | 130+ | Contractor directory and profiles |
| Insights | `/insights/*` | 5+ | Timely analysis and career intelligence |
| Jobs | `/jobs/*` | 4 | SEO content hub for job categories |
| MOS | `/mos/*` | 1,334 | MOS career intelligence (future merge) |

### Navigation

**Header:** Companies | Insights | Search | Auth
**Footer:** For Companies | About | Contact | Privacy | Terms

### Page Table

| Page | URL | Description |
|---|---|---|
| Homepage | `/` | Search + top contractors + browse by specialty |
| Companies | `/companies` | Browse 103+ defense contractors with filters |
| Company Profile | `/companies/[slug]` | Full company profile with claimed content |
| By Specialty | `/companies/specialty/[slug]` | 10 specialty categories |
| By Location | `/companies/location/[state]` | 16+ states |
| Insights Hub | `/insights` | Industry analysis articles |
| Hiring Surge | `/insights/defense-hiring-surge-2026` | Iran conflict analysis |
| Contractors Hiring | `/insights/contractors-hiring-now` | Company-by-company breakdown |
| MOS Demand | `/insights/mos-demand-middle-east` | In-demand specialties |
| Pay & Tax Guide | `/insights/contractor-pay-tax-guide` | Compensation guide |
| For Companies | `/for-companies` | Claimed profiles pricing |
| Profile Manager | `/profile-manager` | Employer dashboard |
| Claim Profile | `/profile-manager/claim` | Claim flow |
| Admin | `/admin` | Admin dashboard |
| Login | `/auth/login` | Magic link auth |
| Callback | `/auth/callback` | Auth callback handler |
| About | `/about` | Services page |
| Contact | `/contact` | Contact form |
| Privacy | `/privacy` | Privacy policy |
| Terms | `/terms` | Terms of service |

---

## 6. Contractor Directory

### Data Source
103+ company profiles seeded from Defense News Top 100 and supplemental contractor data.

### Browse & Search
- Full-text search by company name
- Filter by specialty (10 categories)
- Filter by location (16+ states)
- Sort by revenue or name

### Company Profiles
Each profile includes:
- Company overview and description
- Defense News rank, revenue, employee count
- Stock ticker and public/private status
- Specialties and capabilities
- Office locations
- External links (website, careers, LinkedIn, Wikipedia)
- Claimed profile enhancements (benefits, programs, testimonials)

### Specialty Taxonomy
Aerospace & Defense, Cybersecurity & IT, Intelligence & Analytics, Land Systems, Naval & Maritime, Space Systems, Professional Services, Logistics & Support, Electronics & Sensors, Research & Development.

---

## 7. Insights Content Silo

### Hub
`/insights` -- Collection page with card grid linking to articles.

### Initial Articles (March 2026)

1. **Defense Contractor Hiring Surge 2026** -- Iran conflict impact, defense budget analysis, stock performance, hiring data
2. **Which Defense Contractors Are Hiring Now** -- Company-by-company breakdown with active postings and pay ranges
3. **MOS Codes Most in Demand for Middle East** -- Intelligence, cyber, SOF, combat MOS demand analysis
4. **Military Contractor Pay & Tax Guide** -- FEIE ($132,900), combat zone benefits, compensation optimization

### Design
- Schema.org Article structured data on each page
- Breadcrumb navigation
- Cross-linked to company profiles and other articles
- CTAs to company browse and for-companies pages

---

## 8. Claimed Profiles System

### Tier Structure

| Feature | Free | Claimed ($149/mo) | Premium ($399/mo) |
|---|---|---|---|
| Basic profile | Yes | Yes | Yes |
| Edit description & links | No | Yes | Yes |
| Upload logo | No | Yes | Yes |
| Verified badge | No | Yes | Yes |
| "Why Work Here" section | No | Yes | Yes |
| Notable programs | No | Yes | Yes |
| Basic analytics | No | Yes | Yes |
| Spotlight content | No | No | Yes |
| Employee testimonials | No | No | Yes |
| Priority in search | No | No | Yes |

### Claim Flow
1. Employer visits `/for-companies` landing page
2. Clicks "Get Started" → `/profile-manager/claim`
3. Searches for their company in directory
4. Verifies identity (email domain match or manual review)
5. Selects tier → Stripe Checkout
6. Stripe webhook activates claimed profile
7. Gains access to `/profile-manager` dashboard

### Content Moderation
- Basic profile edits publish immediately
- Spotlight content and testimonials require admin approval
- Admin dashboard at `/admin` for reviewing claims and content

---

## 9. Job Alert Subscriptions

- Email capture form on company profiles and insights pages
- Fields: email (required), keywords, MOS codes, clearance levels, frequency
- Backend stores subscription with unsubscribe token
- Token-based unsubscribe via GET request
- Duplicate emails update preferences rather than creating new records

---

## 10. Authentication & Admin

### Better Auth
- Magic link authentication via Resend email
- Role-based access: user, admin
- Admin email whitelist
- Session management with automatic refresh

### Admin Dashboard (`/admin`)
Tabbed interface:
- **Overview:** System health, metrics, recent activity
- **Claims:** Review pending claim requests, approve/reject
- **Content:** Review sponsored content submissions
- **Contractors:** Manage contractor profiles, HR contacts
- **Users:** User management

---

## 11. Revenue Model

### Placement Fees (Primary -- future)
- $10K-$50K per successful hire
- Staffing pipeline via candidate and company intake forms

### Claimed Profiles SaaS (Secondary)
- $149-$399/month per profile
- Stripe checkout and subscription management
- Target: 10+ claimed profiles = $1,500-$4,000/month MRR
- At 103 contractors, 10% claim rate = 10 profiles

### Sponsored Job Listings (Future)
- $299-$999/month per listing
- Self-serve Stripe checkout
- Featured placement across platform

### Combined Revenue Projections

| Scenario | Placements | SaaS MRR | Total Monthly |
|---|---|---|---|
| Early (mo 1-6) | $0 | $1,500 | $1,500 |
| Growth (6-12) | $15K | $4K | $19K |
| Established (12+) | $40K | $10K | $50K |

---

## 12. SEO Strategy

### Content Silos
- `/companies` (103+ pages) -- company profiles
- `/insights` (5+ pages) -- timely analysis
- `/companies/specialty/*` (10 pages) -- specialty browse
- `/companies/location/*` (16+ pages) -- location browse

### Technical SEO
- Server-side rendering on all public pages
- Dynamic sitemap at `/sitemap.xml` (130+ URLs)
- Schema.org structured data: WebSite, WebPage, Organization, Article, CollectionPage, BreadcrumbList
- Unique meta tags, OG tags, canonical URLs on every page
- Plausible analytics (privacy-friendly, no cookie banner)

### Target Keywords
- "[Company] defense contractor" (103+ variations)
- "defense contractors hiring now"
- "defense contractor hiring surge 2026"
- "military contractor pay"
- "defense contractors in [State]"
- "[Specialty] defense contractors"

---

## 13. Tech Stack

| Layer | Technology |
|---|---|
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

---

## 14. Database Schema

### Directory
- `contractor` -- 103+ defense contractor profiles
- `specialty` -- 10 specialty categories
- `contractorSpecialty` -- many-to-many mappings
- `contractorLocation` -- office locations by state

### Claimed Profiles
- `claimedProfile` -- employer-claimed profile records (tiers: claimed/premium/enterprise)
- `contractorUser` -- users linked to claimed profiles
- `sponsoredContent` -- spotlight content blocks
- `contractorBenefit` -- "Why Work Here" benefits
- `contractorProgram` -- notable programs
- `contractorTestimonial` -- employee testimonials

### Auth
- `user` -- user accounts with role and admin flags
- `session` -- active sessions
- `account` -- OAuth/provider connections
- `verification` -- magic link tokens

### Jobs
- `job` -- job listings with structured data fields

### CRM
- `jobAlertSubscription` -- email alert subscriptions
- `candidateActivity` -- candidate tracking
- `placement` -- placement records
- `contractorContact` -- HR contacts
- `contractorNote` -- internal notes

### Campaigns
- `campaign`, `toastAd`, `featuredContractor`, `featuredListing`, `sponsoredAd`, `sponsoredJob`

### Admin
- `adminActivityLog` -- admin action audit trail
- `recruiterAccess` -- recruiter permission grants

---

## 15. API Endpoints

### Contractor Directory
| Method | Path | Purpose |
|---|---|---|
| GET | /api/contractors | Paginated list with filters |
| GET | /api/contractors/[slug] | Contractor detail |
| GET | /api/contractors/by-location/[state] | By state |
| GET | /api/specialties | All specialties |
| GET | /api/specialties/[slug] | Specialty detail |
| GET | /api/locations | Location list |

### Billing
| Method | Path | Purpose |
|---|---|---|
| POST | /api/billing/create-checkout | Stripe checkout session |
| POST | /api/billing/webhook | Stripe webhooks |
| GET | /api/billing/portal | Customer portal URL |

### Profile Manager
| Method | Path | Purpose |
|---|---|---|
| POST | /api/profile-manager/claim | Submit claim |
| GET | /api/profile-manager/profile | Get profile |
| PATCH | /api/profile-manager/profile | Update profile |
| GET/POST | /api/profile-manager/benefits | Manage benefits |
| GET/POST | /api/profile-manager/programs | Manage programs |

### Admin
| Method | Path | Purpose |
|---|---|---|
| GET | /api/admin/system-health | System metrics |
| GET/PATCH | /api/admin/claims | Claim review |
| GET/PATCH | /api/admin/content | Content review |
| GET | /api/admin/users | User management |

### Alerts
| Method | Path | Purpose |
|---|---|---|
| POST | /api/alerts/subscribe | Subscribe to alerts |
| GET | /api/alerts/unsubscribe | Token-based unsubscribe |

### Other
| Method | Path | Purpose |
|---|---|---|
| GET | /api/search | Global search |
| GET | /api/stats/homepage | Homepage statistics |
| GET | /sitemap.xml | Dynamic sitemap |

---

## 16. Runtime Configuration

| Variable | Purpose |
|---|---|
| `NUXT_PUBLIC_SITE_URL` | Public site URL |
| `RESEND_API_KEY` | Resend email service |
| `BETTER_AUTH_SECRET` | Auth encryption secret |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing |
| `STRIPE_CLAIMED_PRICE_ID` | Stripe price for Claimed tier |
| `STRIPE_PREMIUM_PRICE_ID` | Stripe price for Premium tier |

---

## 17. Success Metrics

### SEO
- 130+ indexed pages
- Top 10 for "[company] contractor" queries within 6 months
- 25,000+ monthly organic traffic at scale

### Business
- 10+ claimed profiles
- $1,500+ MRR from SaaS
- Insights pages driving 5,000+ monthly visits

### Technical
- All public pages SSR with <2s TTFB
- Structured data validated on all page types
- Zero downtime deployments

---

## 18. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| SEO competition | Hard to rank | Focus on long-tail queries + exact-match domain advantage |
| Data accuracy | User distrust | Multiple sources, clear timestamps, editorial review |
| Low claim adoption | No SaaS revenue | Focus on traffic first, then employer outreach |
| Iran conflict duration | Content goes stale | Insights designed as evergreen with timely hooks |
| Stripe integration | Payment failures | Webhook retry logic, manual fallback process |
| Auth security | Account compromise | Magic link (no passwords), session management, admin whitelist |

---

## 19. Roadmap

### Phase 1: Surge Content (Complete)
- Insights hub and 4 articles
- Nav updates, route rules, sitemap
- useArticleSchema composable

### Phase 2: Contractor Directory (Complete)
- 103+ contractor profiles with browse/search
- Specialty and location pages
- Company profile pages with structured data

### Phase 3: Auth & Admin (Complete)
- Better Auth with magic link
- Admin dashboard with claim/content review
- Role-based middleware

### Phase 4: Claimed Profiles & Stripe (Complete)
- Claimed profiles system with tier structure
- Stripe checkout, webhooks, customer portal
- Profile manager dashboard

### Phase 5: Job Alerts (Complete)
- Alert subscription API
- AlertSignupCard component
- Token-based unsubscribe

### Phase 6: Analytics & SEO (Complete)
- Plausible analytics
- Dynamic sitemap
- Schema.org on all page types

### Future
- Sponsored job listings ($299-$999/month)
- MOS career intelligence merge (1,334 pages)
- Job matching and FTS5 search
- Candidate/company intake forms
- Expand to 200-300 contractors
- USAspending contract data integration

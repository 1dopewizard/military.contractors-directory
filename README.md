# military.contractors

**The definitive directory of defense contractors.**

Authoritative company profiles for 48+ U.S. defense contractors with structured data on headquarters, employee count, specialties, and Defense News rankings. Employers can claim and enhance their profiles.

---

## What this is

A comprehensive directory of defense contractors providing:

1. **Company profiles** — Structured data on each contractor (HQ, employees, revenue, specialties)
2. **Browse by specialty** — Find contractors by capability (cybersecurity, aerospace, logistics, etc.)
3. **Browse by location** — Find contractors by state
4. **Claimed profiles** — Employers can verify and enhance their company pages
5. **SEO-optimized** — Every contractor page ranks for "[Company] contractor" searches

This is a **reference directory** that aggregates and structures public data to make it easy to research defense contractors.

---

## Features

### Public Pages

| Page               | URL                             | Description                                  |
| ------------------ | ------------------------------- | -------------------------------------------- |
| Homepage           | `/`                             | Search, top contractors, browse by specialty |
| Contractor profile | `/contractors/[slug]`           | Full company profile with stats and details  |
| Browse all         | `/contractors`                  | Paginated list with search and filters       |
| By specialty       | `/contractors/specialty/[slug]` | Contractors in a specific specialty          |
| By location        | `/contractors/location/[state]` | Contractors in a specific state              |
| Top contractors    | `/top-defense-contractors`      | Ranked list of top defense contractors       |
| For employers      | `/for-employers`                | Marketing page for claimed profiles          |

### Employer Dashboard

| Page       | URL                      | Description             |
| ---------- | ------------------------ | ----------------------- |
| Dashboard  | `/profile-manager`       | Manage claimed profile  |
| Claim flow | `/profile-manager/claim` | Claim a company profile |

### Admin Dashboard

| Section        | Description                      |
| -------------- | -------------------------------- |
| Overview       | Site stats and metrics           |
| Claims         | Review pending claim requests    |
| Content Review | Approve/reject sponsored content |
| Contractors    | Manage contractor profiles       |
| Users          | User management                  |

---

## Repository layout

```
military.contractors/
├── app/
│   ├── components/
│   │   ├── Contractors/        # Contractor cards, skeletons
│   │   ├── Dashboard/
│   │   │   ├── Admin/          # Admin dashboard components
│   │   │   ├── ProfileManager/ # Employer dashboard components
│   │   │   └── Account/        # User account components
│   │   └── ui/                 # shadcn-vue components
│   ├── composables/            # Vue composables
│   ├── layouts/                # Page layouts
│   └── pages/
│       ├── index.vue           # Homepage
│       ├── contractors/        # Contractor pages
│       │   ├── index.vue       # Browse all
│       │   ├── [slug].vue      # Contractor profile
│       │   ├── specialty/      # By specialty
│       │   └── location/       # By location
│       ├── top-defense-contractors.vue
│       ├── for-employers/      # Employer landing
│       ├── profile-manager/    # Employer dashboard
│       ├── admin/              # Admin dashboard
│       └── auth/               # Authentication
├── server/
│   ├── api/
│   │   ├── contractors/        # Contractor endpoints
│   │   ├── specialties/        # Specialty endpoints
│   │   ├── locations/          # Location endpoints
│   │   ├── profile-manager/    # Employer endpoints
│   │   └── admin/              # Admin endpoints
│   ├── database/
│   │   ├── schema/             # Drizzle schema
│   │   │   ├── directory.ts    # contractor, specialty, location
│   │   │   ├── claimed.ts      # claimedProfile, benefits, programs
│   │   │   ├── auth.ts         # Better Auth tables
│   │   │   └── ...
│   │   └── migrations/         # Database migrations
│   └── utils/                  # DB, auth, logger utilities
├── scripts/
│   ├── seed/                   # Data seeding scripts
│   ├── deploy.sh               # VPS deployment
│   └── start-dev.sh            # Development script
├── public/
│   └── logos/
│       └── companies/          # Company logos
├── drizzle.config.ts
├── nuxt.config.ts
└── package.json
```

---

## Tech stack

- **Framework:** Nuxt 4, Vue 3
- **UI:** TailwindCSS, shadcn-vue
- **Database:** libSQL (SQLite), Drizzle ORM
- **Auth:** Better Auth
- **Testing:** Vitest

---

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Create `.env`:

```bash
DATABASE_URL=file:./server/database/app.db
BETTER_AUTH_SECRET=your-secret-here
```

### 3. Run database migrations

```bash
pnpm db:migrate
```

### 4. Seed data (optional)

```bash
pnpm tsx scripts/seed/seed-contractors.ts
```

### 5. Run development server

```bash
pnpm dev
```

The app will be available at http://localhost:3000.

### 6. Build for production

```bash
pnpm build
pnpm start
```

---

## Available scripts

| Command            | Description                     |
| ------------------ | ------------------------------- |
| `pnpm dev`         | Start development server        |
| `pnpm build`       | Build for production            |
| `pnpm start`       | Start production server         |
| `pnpm preview`     | Preview production build        |
| `pnpm db:generate` | Generate Drizzle migrations     |
| `pnpm db:migrate`  | Run database migrations         |
| `pnpm db:push`     | Push schema directly (dev only) |
| `pnpm db:studio`   | Open Drizzle Studio             |
| `pnpm test`        | Run tests                       |

---

## Database schema (key tables)

### Directory Tables

| Table                 | Purpose                          |
| --------------------- | -------------------------------- |
| `contractor`          | Defense contractor profiles      |
| `specialty`           | Specialty/capability taxonomy    |
| `contractorSpecialty` | Contractor-to-specialty mappings |
| `contractorLocation`  | Contractor office locations      |

### Claimed Profiles Tables

| Table                 | Purpose                          |
| --------------------- | -------------------------------- |
| `claimedProfile`      | Employer-claimed profile records |
| `employerUser`        | Users linked to claimed profiles |
| `employerBenefit`     | "Why Work Here" benefits         |
| `employerProgram`     | Notable programs/products        |
| `employerTestimonial` | Employee testimonials            |
| `sponsoredContent`    | Spotlight content blocks         |

### Auth Tables

| Table     | Purpose           |
| --------- | ----------------- |
| `user`    | User accounts     |
| `session` | Active sessions   |
| `account` | OAuth connections |

---

## Deployment

### VPS setup

```bash
# Run setup script on VPS
./scripts/setup-vps.sh

# Clone and deploy
git clone <repo> /var/www/military.contractors
cd /var/www/military.contractors
pnpm install
pnpm build

# Start with pm2
pm2 start .output/server/index.mjs --name military-contractors
pm2 save
```

### Deploy updates

```bash
./scripts/deploy.sh
```

---

## Documentation

| Document         | Purpose                  |
| ---------------- | ------------------------ |
| `prd.md`         | Product requirements     |
| `.cursor/plans/` | Implementation plans     |
| `AGENTS.md`      | Cursor/agent conventions |
| `docs/`          | Feature documentation    |

---

See `prd.md` for full product requirements and roadmap.

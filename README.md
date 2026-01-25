# military.contractors

**The definitive directory of defense contractors.**

Authoritative company profiles for 200+ defense contractors with structured data on headquarters, employee count, specialties, and federal contract intelligence.

---

## What this is

A comprehensive directory of defense contractors providing:

1. **Company profiles** — Structured data on each contractor (HQ, employees, revenue, specialties)
2. **Contract intelligence** — Federal contract data from USAspending
3. **MOS mappings** — Connect military specialties to relevant contractors
4. **Job board** — Defense contractor job listings with MOS-based matching
5. **SEO-optimized** — Every company page ranks for "[Company] contractor" searches

This is a **reference directory** that aggregates and structures public data to make it easy to research defense contractors and find career opportunities.

---

## Repository layout

```
military.contractors/
├── app/
│   ├── components/       # Vue components
│   ├── composables/      # Vue composables
│   ├── layouts/          # Page layouts
│   └── pages/            # Nuxt pages
│       ├── index.vue     # Homepage
│       ├── companies/    # Company pages
│       ├── jobs/         # Job listings
│       └── mos/          # MOS pages
├── server/
│   ├── api/              # Nuxt API routes
│   ├── database/
│   │   ├── app.db        # SQLite database
│   │   ├── schema/       # Drizzle schema
│   │   └── migrations/   # Database migrations
│   └── utils/            # DB, auth, logger utilities
├── scripts/
│   ├── deploy.sh         # VPS deployment script
│   ├── start-dev.sh      # Development script
│   ├── setup-vps.sh      # VPS setup script
│   └── migration/        # Data migration scripts
├── lib/                  # Shared utilities
├── public/               # Static assets
├── tests/                # Test files
├── drizzle.config.ts     # Drizzle ORM config
├── nuxt.config.ts        # Nuxt configuration
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

### 4. Run development server

```bash
pnpm dev
```

The app will be available at http://localhost:3000.

### 5. Build for production

```bash
pnpm build
pnpm start
```

---

## Available scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm preview` | Preview production build |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:push` | Push schema directly (dev only) |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm test` | Run tests |
| `pnpm test:run` | Run tests once |

---

## Database schema (key tables)

| Table | Purpose |
|-------|---------|
| `companies` | Defense contractor profiles |
| `jobs` | Job listings |
| `mos_codes` | Military Occupational Specialties |
| `job_mos_mappings` | Job to MOS relationships |
| `company_mos` | Company to MOS relationships |
| `bases` | Military installations |
| `theaters` | Geographic command regions |

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

| Document | Purpose |
|----------|---------|
| `prd.md` | Product requirements |
| `.cursor/plans/` | Implementation plans |
| `AGENTS.md` | Cursor/agent conventions |
| `docs/` | Feature documentation |

---

See `prd.md` for full product requirements and roadmap.

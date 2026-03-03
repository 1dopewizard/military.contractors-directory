# Scripts

Utility scripts for data management, seeding, and maintenance.

## Directory Structure

```
scripts/
├── seed/              # Mock data generation for development/demo
├── migration/         # Historical migration data (legacy)
│   └── data/          # Exported migration data files
├── maintenance/       # Data cleanup and maintenance utilities
├── pipeline/          # MOS data pipeline scripts
└── README.md
```

## Seed Scripts

Generate mock data for development and demos. All seed scripts use the Vercel AI SDK with GPT to generate realistic data.

> **IMPORTANT:** All seeding scripts MUST use `gpt-5.1` model. Do NOT downgrade to `gpt-4o` or other models. This ensures consistent, high-quality mock data generation.

### Mock Jobs

Generate OCONUS defense contractor job listings:

```bash
# Generate 50 mock jobs (default)
npx tsx scripts/seed/seed-mock-jobs.ts

# Options:
#   --dry-run           Preview without inserting
#   --replace           Clear existing mock jobs first
#   --count=N           Number of jobs to generate (default: 50)
#   --category=CAT      Focus on category: IT_CYBER, INTELLIGENCE, or COMMUNICATIONS
```

### Mock Job-MOS Mappings

Generate job-to-MOS mappings for existing jobs:

```bash
# Generate mappings for active jobs
npx tsx scripts/seed/seed-mock-mappings.ts

# Options:
#   --dry-run           Preview without inserting
#   --replace           Clear existing mock mappings first
#   --job-limit=N       Limit jobs to process (default: 100)
```

**Note:** Run `seed-mock-jobs.ts` first to have jobs to map.

### Community Intel

Generate salary reports and interview experiences:

```bash
# Seed community intel mock data (salary reports + interview experiences)
npx tsx scripts/seed/seed-community-mock-data.ts

# Options:
#   --dry-run           Preview without inserting
#   --replace           Clear existing mock data first
#   --salaries=N        Number of salary reports (default: 55)
#   --interviews=N      Number of interviews (default: 35)
#   --salaries-only     Only generate salary reports
#   --interviews-only   Only generate interview experiences
```

### Contributors

Generate mock contributor users with linked submissions:

```bash
# Seed mock contributors for leaderboard
npx tsx scripts/seed/seed-contributors.ts

# Options:
#   --dry-run           Preview without inserting
#   --replace           Clear existing mock contributors first
```

## Pipeline Scripts

Scripts for MOS data enrichment and processing:

```bash
# Classify MOS codes by category
npx tsx scripts/pipeline/mos-classify.ts --dry-run

# Summarize MOS descriptions
npx tsx scripts/pipeline/mos-summarize.ts --dry-run

# Enrich MOS data with skills/certs
npx tsx scripts/pipeline/mos-enrich.ts --dry-run

# Generate embeddings for MOS codes
npx tsx scripts/pipeline/mos-embed.ts --dry-run

# Scrape MOS data from military sources
npx tsx scripts/pipeline/mos-scrape-army.ts
npx tsx scripts/pipeline/mos-scrape-navy.ts
npx tsx scripts/pipeline/mos-scrape-airforce.ts
npx tsx scripts/pipeline/mos-scrape-marines.ts
npx tsx scripts/pipeline/mos-scrape-coastguard.ts
npx tsx scripts/pipeline/mos-scrape-spaceforce.ts
```

## Maintenance Scripts

Data cleanup and maintenance utilities.

```bash
# Deduplicate jobs
npx tsx scripts/maintenance/dedupe-jobs.ts
```

## Running Scripts

All scripts should be run from the `apps/contractors` directory:

```bash
cd apps/contractors
npx tsx scripts/<category>/<script>.ts [options]
```

## Environment Variables

Scripts require these environment variables (loaded from `.env`):

- `OPENAI_API_KEY` or `NUXT_OPENAI_API_KEY` - For AI-powered generation
- Database is accessed via local SQLite file (`server/database/app.db`)

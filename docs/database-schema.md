# Database Schema

This document defines the core database tables for military.contractors.

## Core Tables

### `mos_codes` (MOS Ontology)

Stores military occupational specialty data scraped from COOL API and official branch websites.

```sql
CREATE TABLE mos_codes (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core identity
  branch                   text NOT NULL,
  code                     text NOT NULL,
  name                     text NOT NULL,
  rank                     text NOT NULL,
  description              text,
  source_url               text NOT NULL,
  
  -- Classification
  mos_category             text NOT NULL DEFAULT 'UNCLASSIFIED',
  source                   text DEFAULT 'UNKNOWN',
  
  -- LLM Enrichment: Skills & Tools
  core_skills              jsonb DEFAULT '[]',
  tools_platforms          jsonb DEFAULT '[]',
  mission_domains          jsonb DEFAULT '[]',
  environments             jsonb DEFAULT '[]',
  
  -- LLM Enrichment: Career Mapping
  civilian_roles           jsonb DEFAULT '[]',
  role_families            jsonb DEFAULT '[]',
  company_archetypes       jsonb DEFAULT '[]',
  
  -- LLM Enrichment: Profiles
  clearance_profile        jsonb,
  deployment_profile       jsonb,
  seniority_distribution   jsonb,
  pay_band_hint            text,
  
  -- LLM Enrichment: Certifications
  common_certs             jsonb DEFAULT '[]',
  training_paths           jsonb,
  
  -- LLM Enrichment: Summary
  summarized_description   text,
  
  -- Computed stats (updated by job mapping pipeline)
  job_count_total          integer DEFAULT 0,
  job_count_oconus         integer DEFAULT 0,
  job_count_conus          integer DEFAULT 0,
  
  -- Enrichment metadata
  enrichment_version       integer DEFAULT 0,
  last_enriched_at         timestamptz,
  embedding                vector(1536),
  
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE (branch, code)
);
```

### `mos_category` Vocabulary

| Value | Description |
|-------|-------------|
| `IT_CYBER` | IT, cybersecurity, signals, networks, comms |
| `INTELLIGENCE` | Intel analysis, SIGINT, counterintel |
| `LOGISTICS` | Supply chain, transportation |
| `MEDICAL` | Healthcare, medical services |
| `AVIATION` | Flight ops, aircraft maintenance |
| `COMBAT` | Infantry, armor, artillery |
| `ENGINEERING` | Construction, utilities, EOD |
| `SUPPORT` | Admin, legal, finance, HR |
| `UNCLASSIFIED` | Default for uncategorized MOS codes |

### `companies` Table

Defense contractor profiles.

```sql
CREATE TABLE companies (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               text NOT NULL UNIQUE,
  name               text NOT NULL,
  summary            text NOT NULL,
  description        text,
  logo_url           text,
  website_url        text,
  careers_url        text,
  headquarters       text,
  employee_count     text,
  founded_year       integer,
  stock_symbol       text,
  domains            text[] NOT NULL DEFAULT '{}',
  theaters           text[] NOT NULL DEFAULT '{}',
  is_prime_contractor boolean DEFAULT false,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);
```

### `jobs` Table

Job postings scraped from contractor career sites.

```sql
CREATE TABLE jobs (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                 text,
  title                text NOT NULL,
  company              text NOT NULL,
  company_id           uuid REFERENCES companies(id),
  description          text NOT NULL,
  snippet              text,
  
  -- Location
  location             text NOT NULL,
  location_type        text,           -- 'CONUS', 'OCONUS', 'Remote', 'Hybrid'
  theater              text,           -- 'CENTCOM', 'EUCOM', etc.
  is_oconus            boolean,
  location_data        jsonb,          -- Structured location details
  
  -- Compensation
  salary_min           integer,
  salary_max           integer,
  currency             text DEFAULT 'USD',
  compensation_data    jsonb,          -- Full compensation details
  
  -- Clearance
  clearance_required   text,
  clearance_data       jsonb,          -- Detailed clearance requirements
  sponsor_category     text DEFAULT 'NOT_SPECIFIED',
  
  -- Job Details
  requirements         text[],
  seniority            text,
  employment_type      text,
  qualifications_data  jsonb,          -- Education, experience, skills
  responsibilities_data jsonb,         -- Job responsibilities
  tools_tech           jsonb,          -- Required tools/technologies
  contract_data        jsonb,          -- Contract/program info
  compliance_data      jsonb,          -- Compliance requirements
  domain_tags          jsonb,          -- Domain classifications
  military_mapping     jsonb,          -- MOS mapping hints from source
  
  -- Source tracking
  source_site          text,
  external_id          text,
  source_data          jsonb,          -- Raw source metadata
  posting_data         jsonb,          -- Posted/expires dates
  employer_data        jsonb,          -- Employer info from source
  
  -- Status
  status               text DEFAULT 'PENDING_REVIEW',
  is_active            boolean DEFAULT true,
  featured             boolean DEFAULT false,
  posted_at            timestamptz DEFAULT now(),
  expires_at           timestamptz,
  
  -- Ownership
  created_by           uuid,
  
  -- AI fields
  embedding            vector(1536),
  
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now(),
  
  UNIQUE (source_site, external_id)
);
```

### `job_mos_mappings` Table

Links jobs to relevant MOS codes with match strength.

```sql
CREATE TABLE job_mos_mappings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  mos_id           uuid REFERENCES mos_codes(id),
  mos_code         text,
  match_strength   text NOT NULL,         -- 'STRONG', 'MEDIUM', 'WEAK'
  confidence_score numeric NOT NULL,
  mapping_reason   text NOT NULL,
  source           text DEFAULT 'RULE_BASED',  -- 'RULE_BASED', 'LLM', 'MANUAL'
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
```

## User Tables

### `profiles`

```sql
CREATE TABLE profiles (
  user_id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email              text,
  display_name       text,
  avatar_url         text,
  branch             text,
  clearance_level    text,
  preferred_regions  text[],
  preferred_theaters text[],
  oconus_preference  boolean,
  user_type          text,    -- 'candidate', 'employer', 'both'
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);
```

### `saved_jobs`

```sql
CREATE TABLE saved_jobs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id      uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  notes       text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, job_id)
);
```

### `job_alert_subscriptions`

```sql
CREATE TABLE job_alert_subscriptions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                text NOT NULL UNIQUE,
  name                 text,
  user_id              uuid REFERENCES auth.users(id),
  branch               text,
  clearance_level      text,
  mos_codes            text[] NOT NULL DEFAULT '{}',
  frequency            text NOT NULL DEFAULT 'DAILY',
  include_similar_mos  boolean NOT NULL DEFAULT true,
  location_preference  text,
  is_active            boolean NOT NULL DEFAULT true,
  unsubscribe_token    uuid NOT NULL DEFAULT gen_random_uuid(),
  last_sent_at         timestamptz,
  emails_sent_count    integer NOT NULL DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
```

## Sponsored Ads Tables

See `docs/sponsored_ads.md` for full schema and algorithm documentation.

### `sponsored_ads` (Company Spotlights)

```sql
CREATE TABLE sponsored_ads (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser        text NOT NULL,
  tagline           text NOT NULL,
  headline          text NOT NULL,
  description       text NOT NULL,
  cta_text          text NOT NULL,
  cta_url           text NOT NULL,
  status            ad_status NOT NULL DEFAULT 'draft',
  priority          integer DEFAULT 1,    -- 1=standard, 2=premium
  impressions       integer NOT NULL DEFAULT 0,
  clicks            integer NOT NULL DEFAULT 0,
  embedding         vector(1536),
  matched_mos_codes text[] DEFAULT '{}',
  starts_at         timestamptz,
  ends_at           timestamptz,
  created_by        uuid,
  reviewed_by       uuid,
  reviewed_at       timestamptz,
  rejection_reason  text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
```

### `sponsored_jobs`

```sql
CREATE TABLE sponsored_jobs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title             text NOT NULL,
  company           text NOT NULL,
  location          text NOT NULL,
  location_type     text,
  clearance         text NOT NULL,
  salary            text NOT NULL,
  pitch             text NOT NULL,
  apply_url         text NOT NULL,
  sponsor_category  text DEFAULT 'NOT_SPECIFIED',
  status            ad_status NOT NULL DEFAULT 'draft',
  priority          integer DEFAULT 1,
  impressions       integer NOT NULL DEFAULT 0,
  clicks            integer NOT NULL DEFAULT 0,
  embedding         vector(1536),
  matched_mos_codes text[] DEFAULT '{}',
  starts_at         timestamptz,
  ends_at           timestamptz,
  created_by        uuid,
  reviewed_by       uuid,
  reviewed_at       timestamptz,
  rejection_reason  text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
```

### `ad_status` Enum

```sql
CREATE TYPE ad_status AS ENUM (
  'draft',
  'pending_review',
  'pending_payment',
  'active',
  'expired',
  'rejected'
);
```

## Related Documentation

- [Sponsored Ads System](./sponsored_ads.md) — Ad serving algorithm, pricing, and SQL functions

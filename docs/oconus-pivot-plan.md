Me:
I have implenented the plan. Review the codebase and give me a report. Was anythin missed, could be improved?

---

AI:

I'll review the codebase to check the OCONUS pivot implementation against the plan. Let me examine the key areas:
Now I have enough information to provide a comprehensive review:

# OCONUS Pivot Implementation Plan

**Date:** December 29, 2024  
**Status:** Approved  
**Scope:** Transform military.contractors from a general cleared job board to the definitive OCONUS contractor job platform.

---

## Executive Summary

military.contractors is pivoting to become an **OCONUS-only** contractor job platform. This strategic focus provides:

- **Niche dominance** over a category no one owns
- **Higher placement fees** ($28k-$50k vs $15k-$25k for CONUS)
- **Clearer brand alignment** ("military.contractors" = overseas contractor work)
- **Reduced competition** (ClearanceJobs, Indeed don't specialize in OCONUS)
- **Higher-intent candidates** (self-selecting for overseas lifestyle)

---

## Phase Overview

| Phase | Name | Duration | Key Deliverables |
|-------|------|----------|------------------|
| **A** | Data & Schema Foundation | 3-4 days | Theaters table, bases table, clearance fields, CONUS job removal |
| **B** | Frontend OCONUS Transformation | 4-5 days | Homepage redesign, theater navigation, search filters |
| **C** | Candidate Capture Enhancement | 2-3 days | Clearance attestation, ETS date, deployment readiness |
| **D** | SEO & Content | 3-4 days | Theater landing pages, base pages, sitemap updates |
| **E** | Scraper Refocus | 3-4 days | OCONUS employer scrapers, theater extraction |
| **F** | Employer & Placement | 2-3 days | /employers page, placement pipeline completion |

**Total Estimated Duration:** 3-4 weeks

---

## Phase A: Data & Schema Foundation

### A1. Create `theaters` Table

```sql
CREATE TABLE theaters (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text,
  region text, -- 'Middle East', 'Europe', 'Asia-Pacific', 'Africa', 'Americas'
  countries text[] DEFAULT '{}',
  major_bases text[] DEFAULT '{}',
  job_count integer DEFAULT 0,
  avg_salary_min integer,
  avg_salary_max integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed data
INSERT INTO theaters (code, name, region, countries, major_bases) VALUES
  ('CENTCOM', 'U.S. Central Command', 'Middle East', 
   ARRAY['Kuwait', 'Qatar', 'UAE', 'Bahrain', 'Iraq', 'Jordan', 'Saudi Arabia', 'Afghanistan'],
   ARRAY['Camp Arifjan', 'Al Udeid Air Base', 'Ali Al Salem', 'Camp Buehring', 'Al Dhafra']),
  ('EUCOM', 'U.S. European Command', 'Europe',
   ARRAY['Germany', 'Italy', 'UK', 'Poland', 'Spain', 'Belgium', 'Netherlands', 'Turkey'],
   ARRAY['Ramstein Air Base', 'Stuttgart', 'Grafenwoehr', 'Vicenza', 'Aviano', 'RAF Lakenheath', 'Incirlik']),
  ('INDOPACOM', 'U.S. Indo-Pacific Command', 'Asia-Pacific',
   ARRAY['Japan', 'South Korea', 'Guam', 'Australia', 'Philippines', 'Singapore', 'Thailand'],
   ARRAY['Camp Humphreys', 'Yokota Air Base', 'Kadena Air Base', 'Osan Air Base', 'Yokosuka', 'Sasebo']),
  ('AFRICOM', 'U.S. Africa Command', 'Africa',
   ARRAY['Djibouti', 'Kenya', 'Niger', 'Somalia'],
   ARRAY['Camp Lemonnier']),
  ('SOUTHCOM', 'U.S. Southern Command', 'Americas',
   ARRAY['Honduras', 'Colombia', 'Cuba', 'Panama'],
   ARRAY['Soto Cano Air Base', 'Guantanamo Bay']);

-- RLS
ALTER TABLE theaters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "theaters_public_read" ON theaters FOR SELECT USING (true);
```

### A2. Create `bases` Table

```sql
CREATE TABLE bases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  theater_code text REFERENCES theaters(code),
  country text NOT NULL,
  city text,
  description text,
  job_count integer DEFAULT 0,
  coordinates jsonb, -- {lat, lng} for future map features
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed major bases
INSERT INTO bases (slug, name, theater_code, country, city) VALUES
  -- CENTCOM
  ('camp-arifjan', 'Camp Arifjan', 'CENTCOM', 'Kuwait', 'Kuwait City'),
  ('al-udeid', 'Al Udeid Air Base', 'CENTCOM', 'Qatar', 'Doha'),
  ('ali-al-salem', 'Ali Al Salem Air Base', 'CENTCOM', 'Kuwait', NULL),
  ('camp-buehring', 'Camp Buehring', 'CENTCOM', 'Kuwait', NULL),
  ('al-dhafra', 'Al Dhafra Air Base', 'CENTCOM', 'UAE', 'Abu Dhabi'),
  -- EUCOM
  ('ramstein', 'Ramstein Air Base', 'EUCOM', 'Germany', 'Kaiserslautern'),
  ('stuttgart', 'Stuttgart Garrison', 'EUCOM', 'Germany', 'Stuttgart'),
  ('grafenwoehr', 'Grafenwoehr Training Area', 'EUCOM', 'Germany', 'Grafenwoehr'),
  ('vicenza', 'Caserma Ederle', 'EUCOM', 'Italy', 'Vicenza'),
  ('aviano', 'Aviano Air Base', 'EUCOM', 'Italy', 'Aviano'),
  ('raf-lakenheath', 'RAF Lakenheath', 'EUCOM', 'UK', 'Suffolk'),
  ('incirlik', 'Incirlik Air Base', 'EUCOM', 'Turkey', 'Adana'),
  -- INDOPACOM
  ('camp-humphreys', 'Camp Humphreys', 'INDOPACOM', 'South Korea', 'Pyeongtaek'),
  ('yokota', 'Yokota Air Base', 'INDOPACOM', 'Japan', 'Tokyo'),
  ('kadena', 'Kadena Air Base', 'INDOPACOM', 'Japan', 'Okinawa'),
  ('osan', 'Osan Air Base', 'INDOPACOM', 'South Korea', 'Pyeongtaek'),
  ('yokosuka', 'Yokosuka Naval Base', 'INDOPACOM', 'Japan', 'Yokosuka'),
  ('andersen', 'Andersen Air Force Base', 'INDOPACOM', 'Guam', 'Yigo'),
  -- AFRICOM
  ('camp-lemonnier', 'Camp Lemonnier', 'AFRICOM', 'Djibouti', 'Djibouti City'),
  -- SOUTHCOM
  ('soto-cano', 'Soto Cano Air Base', 'SOUTHCOM', 'Honduras', 'Comayagua'),
  ('guantanamo', 'Guantanamo Bay Naval Base', 'SOUTHCOM', 'Cuba', NULL);

-- RLS
ALTER TABLE bases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bases_public_read" ON bases FOR SELECT USING (true);
```

### A3. Extend `job_alert_subscriptions` for OCONUS

```sql
ALTER TABLE job_alert_subscriptions ADD COLUMN IF NOT EXISTS
  preferred_theaters text[] DEFAULT '{}',
  clearance_level text CHECK (clearance_level IN ('NONE', 'PUBLIC_TRUST', 'SECRET', 'TOP_SECRET', 'TS_SCI')),
  clearance_status text CHECK (clearance_status IN ('active', 'inactive_transferable', 'inactive_expired', 'never_held', 'in_progress')),
  polygraph_type text CHECK (polygraph_type IN ('none', 'ci_poly', 'full_scope', 'lifestyle')),
  clearance_attested_at timestamptz,
  has_valid_passport boolean,
  willing_to_deploy_30_days boolean;
```

### A4. Add `base_id` to `jobs` Table

```sql
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS base_id uuid REFERENCES bases(id);
CREATE INDEX idx_jobs_base_id ON jobs (base_id);
CREATE INDEX idx_jobs_theater ON jobs (theater);
CREATE INDEX idx_jobs_oconus_active ON jobs (is_oconus, is_active) WHERE is_oconus = true AND is_active = true;
```

### A5. Remove CONUS Jobs

```sql
-- Delete CONUS jobs (non-OCONUS)
DELETE FROM job_mos_mappings 
WHERE job_id IN (SELECT id FROM jobs WHERE is_oconus = false OR is_oconus IS NULL);

DELETE FROM mos_job_rankings
WHERE job_id IN (SELECT id FROM jobs WHERE is_oconus = false OR is_oconus IS NULL);

DELETE FROM jobs WHERE is_oconus = false OR is_oconus IS NULL;
```

### A6. Add OCONUS Mock Jobs

See Appendix A for full job seed data covering all theaters.

---

## Phase B: Frontend OCONUS Transformation

### B1. Homepage Redesign (`app/pages/index.vue`)

**Changes:**
- Replace generic hero with OCONUS-focused messaging
- Add theater selector (CENTCOM, EUCOM, INDOPACOM, AFRICOM, SOUTHCOM)
- Show "Featured OCONUS Positions" instead of generic featured jobs
- Add theater stats section ("Hot Theaters")
- Update footer/value props to emphasize overseas contractor specialization

**New Components:**
- `TheaterSelector.vue` — clickable theater cards/buttons
- `TheaterStats.vue` — job counts per theater
- `FeaturedOCONUSJobs.vue` — featured OCONUS positions

### B2. Search Page Updates (`app/pages/search.vue`)

**Changes:**
- Add theater filter as primary filter (before MOS/keyword)
- Add country filter (cascades from theater selection)
- Add base filter (cascades from country selection)
- Remove CONUS-specific filters (US state, city)
- Update market snapshot to show OCONUS-specific stats

**Filter Order:**
1. Theater (CENTCOM, EUCOM, INDOPACOM, AFRICOM, SOUTHCOM, All)
2. Country (filtered by theater)
3. Clearance Level
4. MOS / Keywords
5. Salary Range

### B3. Job Card Updates (`app/components/Jobs/JobCard.vue`)

**Changes:**
- Add theater badge prominently (color-coded by theater)
- Show base name when available
- Emphasize per diem / COLA / hardship pay indicators
- Add "deployment readiness" indicator if job is urgent fill

### B4. Job Detail Updates (`app/pages/jobs/[slug].vue`)

**Changes:**
- Add theater context section
- Show base information with link to base page
- Add "What to expect" section for OCONUS life (housing, per diem, etc.)
- Update schema.org with theater/location specifics

### B5. Navigation Updates

**Changes:**
- Add theater dropdown in header nav
- Update mobile nav with theater quick links
- Add "OCONUS" branding element to header

---

## Phase C: Candidate Capture Enhancement

### C1. Enhanced Job Alert Signup

**New Fields:**
- Preferred theaters (multi-select)
- Clearance level (dropdown)
- Clearance status (dropdown)
- Polygraph type (dropdown)
- ETS date (date picker, if active duty)
- Valid passport (checkbox)
- Willing to deploy in 30 days (checkbox)

**UI/UX:**
- Two-step signup: Basic (email, MOS) → Enhanced (clearance, deployment readiness)
- Optional but encouraged for better job matching
- Trust signal: "Self-reported. Employers verify during hiring."

### C2. Clearance Confidence Score

**Implementation:** Server-side computed field based on:
- MOS correlation (certain MOSes require clearances)
- Resume content analysis (if uploaded)
- Engagement patterns (clicks on TS/SCI jobs)
- Consistency of self-reported data

**Display:** Show to admins in candidate management, not to candidates.

### C3. Express Interest Enhancement

**Updates:**
- Pre-fill clearance data from profile
- Add "deployment timeline" field
- Capture "currently in theater" status for hot candidates

---

## Phase D: SEO & Content

### D1. Theater Landing Pages

**Routes:**
- `/oconus` — All OCONUS jobs overview
- `/oconus/centcom` — CENTCOM theater page
- `/oconus/eucom` — EUCOM theater page
- `/oconus/indopacom` — INDOPACOM theater page
- `/oconus/africom` — AFRICOM theater page
- `/oconus/southcom` — SOUTHCOM theater page

**Content:**
- Theater description and context
- Job listings for theater
- Top employers in theater
- Major bases list
- Common roles/MOSes
- Average salary ranges

### D2. Country Pages

**Routes:**
- `/oconus/centcom/kuwait`
- `/oconus/eucom/germany`
- `/oconus/indopacom/japan`
- etc.

**Content:**
- Country overview for contractors
- Bases in country
- Job listings filtered to country
- Living/working considerations

### D3. Base Pages

**Routes:**
- `/oconus/centcom/camp-arifjan`
- `/oconus/eucom/ramstein`
- `/oconus/indopacom/camp-humphreys`
- etc.

**Content:**
- Base overview
- Current job openings at base
- Typical employers
- Quality of life info (when available)

### D4. MOS + Theater Combo Pages

**Routes:**
- `/oconus/centcom/mos/25b`
- `/oconus/eucom/mos/35f`

**Content:**
- MOS-specific jobs in theater
- Combines MOS expertise with geographic focus

### D5. Sitemap Updates

- Add theater sitemap segment
- Add country sitemap segment
- Add base sitemap segment
- Update job sitemap to include theater metadata

---

## Phase E: Scraper Refocus

### E1. Priority Employer List

| Tier | Employers | OCONUS Footprint |
|------|-----------|------------------|
| **1** | KBR, V2X, Amentum | Massive (LOGCAP, base ops) |
| **2** | PAE, Fluor, CACI | Large (support, IT, intel) |
| **3** | Leidos, ManTech, Peraton | Selective programs |
| **4** | L3Harris, Viasat | Comms/SATCOM overseas |

### E2. Scraper Enhancements

**New extraction fields:**
- `theater` — detect from location text
- `base_name` — extract specific base/installation
- `country` — parse from location
- `per_diem` — extract per diem rates if mentioned
- `housing_provided` — boolean flag
- `rotation_schedule` — e.g., "90 days on / 30 days off"

**Theater Detection Logic:**
```python
THEATER_KEYWORDS = {
    'CENTCOM': ['kuwait', 'qatar', 'iraq', 'bahrain', 'uae', 'jordan', 'saudi', 'arifjan', 'udeid'],
    'EUCOM': ['germany', 'italy', 'uk', 'poland', 'ramstein', 'stuttgart', 'vicenza', 'lakenheath'],
    'INDOPACOM': ['japan', 'korea', 'guam', 'okinawa', 'humphreys', 'yokota', 'kadena'],
    'AFRICOM': ['djibouti', 'lemonnier', 'kenya', 'niger'],
    'SOUTHCOM': ['honduras', 'soto cano', 'guantanamo', 'colombia'],
}
```

### E3. CONUS Job Filtering

**At scrape time:** Skip jobs that are clearly CONUS (US city/state without overseas indicators).

**At ingestion:** Only insert jobs where `is_oconus = true`.

---

## Phase F: Employer & Placement

### F1. `/employers` Page Redesign

**Messaging:**
- "We Fill Your Hardest OCONUS Positions"
- Emphasize cleared veteran pipeline
- Highlight theater coverage
- Contingency placement model

**Form:**
- Company name
- Contact info
- Role title
- Theater/location
- Clearance requirement
- Urgency level

### F2. Placement Pipeline Completion

**Remaining work from Phase 3 of original PRD:**
- Admin candidates tab with OCONUS-specific filters
- Placement tracking (kanban/table view)
- Employer contacts management
- Activity tracking for engagement scoring

---

## Appendix A: OCONUS Mock Job Seed Data

### CENTCOM Jobs (15 jobs)

```sql
INSERT INTO jobs (
  title, company, location, is_oconus, theater, location_type,
  clearance_required, salary_min, salary_max, description, snippet,
  status, is_active, source_type
) VALUES
-- Kuwait
('Senior Network Engineer', 'KBR', 'Camp Arifjan, Kuwait', true, 'CENTCOM', 'OCONUS',
 'TS/SCI', 145000, 175000, 
 'Provide enterprise network engineering support for theater-wide communications infrastructure. Manage Cisco routers, switches, and firewalls across multiple tactical and strategic networks.',
 'Enterprise network engineering for CENTCOM theater operations',
 'ACTIVE', true, 'admin_created'),

('Cyber Security Analyst', 'V2X', 'Kuwait City, Kuwait', true, 'CENTCOM', 'OCONUS',
 'TS/SCI', 135000, 165000,
 'Monitor and defend DoD networks against advanced persistent threats. Conduct threat hunting, incident response, and security assessments across CENTCOM AOR.',
 'Defensive cyber operations for CENTCOM networks',
 'ACTIVE', true, 'admin_created'),

('Intelligence Analyst - SIGINT', 'CACI International', 'Camp Arifjan, Kuwait', true, 'CENTCOM', 'OCONUS',
 'TS/SCI with CI Poly', 125000, 155000,
 'Provide signals intelligence analysis supporting combat operations. Process, exploit, and disseminate SIGINT products for tactical and operational commanders.',
 'SIGINT analysis supporting CENTCOM combat operations',
 'ACTIVE', true, 'admin_created'),

('Help Desk Technician', 'Amentum', 'Camp Buehring, Kuwait', true, 'CENTCOM', 'OCONUS',
 'Secret', 85000, 105000,
 'Provide Tier 1/2 IT support for deployed military and civilian personnel. Troubleshoot hardware, software, and network connectivity issues.',
 'IT help desk support for deployed forces',
 'ACTIVE', true, 'admin_created'),

('SATCOM Technician', 'Viasat Government', 'Al Udeid Air Base, Qatar', true, 'CENTCOM', 'OCONUS',
 'Secret', 115000, 145000,
 'Install, maintain, and troubleshoot satellite communication systems. Support beyond-line-of-sight communications for air operations.',
 'Satellite communications support at Al Udeid AB',
 'ACTIVE', true, 'admin_created'),

-- Qatar
('Systems Administrator', 'Leidos', 'Al Udeid Air Base, Qatar', true, 'CENTCOM', 'OCONUS',
 'TS/SCI', 125000, 155000,
 'Manage Windows and Linux server infrastructure supporting Combined Air Operations Center. Ensure 99.99% uptime for mission-critical systems.',
 'Server administration for CAOC operations',
 'ACTIVE', true, 'admin_created'),

('Intelligence Analyst - All Source', 'ManTech', 'Al Udeid Air Base, Qatar', true, 'CENTCOM', 'OCONUS',
 'TS/SCI', 130000, 160000,
 'Fuse multi-INT products to provide comprehensive threat assessments. Brief senior military leaders on regional security developments.',
 'All-source intelligence analysis for air operations',
 'ACTIVE', true, 'admin_created'),

-- Iraq
('Network Operations Specialist', 'KBR', 'Baghdad, Iraq', true, 'CENTCOM', 'OCONUS',
 'Secret', 140000, 170000,
 'Manage tactical network operations in austere environment. Provide 24/7 network monitoring and incident response.',
 'Network operations in Iraq theater',
 'ACTIVE', true, 'admin_created'),

-- Jordan
('Cyber Security Engineer', 'CACI International', 'Amman, Jordan', true, 'CENTCOM', 'OCONUS',
 'TS/SCI', 135000, 165000,
 'Design and implement security architectures for partner nation engagement. Support cybersecurity capacity building initiatives.',
 'Cyber security engineering for partner nation support',
 'ACTIVE', true, 'admin_created'),

-- Bahrain
('IT Project Manager', 'General Dynamics IT', 'NSA Bahrain', true, 'CENTCOM', 'OCONUS',
 'TS/SCI', 145000, 175000,
 'Lead IT infrastructure modernization projects for Fifth Fleet headquarters. Manage contractor teams and coordinate with Navy stakeholders.',
 'IT project management for Naval Forces Central Command',
 'ACTIVE', true, 'admin_created');

-- EUCOM Jobs (12 jobs)
INSERT INTO jobs (
  title, company, location, is_oconus, theater, location_type,
  clearance_required, salary_min, salary_max, description, snippet,
  status, is_active, source_type
) VALUES
-- Germany
('Senior Systems Engineer', 'Leidos', 'Stuttgart, Germany', true, 'EUCOM', 'OCONUS',
 'TS/SCI', 135000, 165000,
 'Provide systems engineering support for EUCOM J6 directorate. Design and integrate C4ISR systems across European theater.',
 'C4ISR systems engineering at EUCOM headquarters',
 'ACTIVE', true, 'admin_created'),

('Intelligence Analyst - Russia/Ukraine', 'Booz Allen Hamilton', 'Stuttgart, Germany', true, 'EUCOM', 'OCONUS',
 'TS/SCI with CI Poly', 140000, 170000,
 'Provide strategic intelligence analysis on Russian military capabilities and activities. Support NATO interoperability initiatives.',
 'Russia/Ukraine intelligence analysis for EUCOM',
 'ACTIVE', true, 'admin_created'),

('Network Engineer', 'CACI International', 'Ramstein Air Base, Germany', true, 'EUCOM', 'OCONUS',
 'Secret', 115000, 145000,
 'Manage enterprise network infrastructure for USAFE headquarters. Support network modernization and cloud migration initiatives.',
 'Network engineering for USAFE operations',
 'ACTIVE', true, 'admin_created'),

('Cybersecurity Analyst', 'ManTech', 'Grafenwoehr, Germany', true, 'EUCOM', 'OCONUS',
 'TS/SCI', 125000, 155000,
 'Conduct cybersecurity operations for Army training networks. Perform vulnerability assessments and penetration testing.',
 'Cybersecurity for Army Europe training operations',
 'ACTIVE', true, 'admin_created'),

('SIGINT Analyst', 'Peraton', 'Wiesbaden, Germany', true, 'EUCOM', 'OCONUS',
 'TS/SCI with Full Scope Poly', 145000, 175000,
 'Perform signals intelligence analysis supporting European theater operations. Collaborate with Five Eyes partners.',
 'SIGINT analysis for European operations',
 'ACTIVE', true, 'admin_created'),

-- Italy
('IT Specialist', 'V2X', 'Vicenza, Italy', true, 'EUCOM', 'OCONUS',
 'Secret', 95000, 120000,
 'Provide IT support for 173rd Airborne Brigade. Manage tactical and garrison network systems.',
 'IT support for airborne operations in Italy',
 'ACTIVE', true, 'admin_created'),

('Communications Technician', 'L3Harris Technologies', 'Aviano Air Base, Italy', true, 'EUCOM', 'OCONUS',
 'Secret', 100000, 130000,
 'Maintain and repair tactical radio systems. Support flight line communications and air traffic control systems.',
 'Communications maintenance at Aviano AB',
 'ACTIVE', true, 'admin_created'),

-- UK
('Software Developer', 'Leidos', 'RAF Molesworth, UK', true, 'EUCOM', 'OCONUS',
 'TS/SCI', 130000, 160000,
 'Develop intelligence applications for Joint Intelligence Operations Center. Work with classified datasets and APIs.',
 'Intelligence software development in UK',
 'ACTIVE', true, 'admin_created'),

-- Poland
('Logistics Coordinator', 'KBR', 'Poznan, Poland', true, 'EUCOM', 'OCONUS',
 'Secret', 95000, 120000,
 'Coordinate logistics support for NATO enhanced Forward Presence. Manage supply chain for rotating US forces.',
 'Logistics coordination for NATO eFP',
 'ACTIVE', true, 'admin_created'),

-- Turkey
('Intelligence Analyst - Counterterrorism', 'SAIC', 'Incirlik Air Base, Turkey', true, 'EUCOM', 'OCONUS',
 'TS/SCI', 135000, 165000,
 'Provide counterterrorism intelligence analysis supporting operations against ISIS and regional extremist groups.',
 'CT intelligence analysis at Incirlik AB',
 'ACTIVE', true, 'admin_created');

-- INDOPACOM Jobs (12 jobs)
INSERT INTO jobs (
  title, company, location, is_oconus, theater, location_type,
  clearance_required, salary_min, salary_max, description, snippet,
  status, is_active, source_type
) VALUES
-- South Korea
('Senior Network Administrator', 'V2X', 'Camp Humphreys, South Korea', true, 'INDOPACOM', 'OCONUS',
 'TS/SCI', 135000, 165000,
 'Manage enterprise network operations for USFK headquarters. Lead team of network engineers supporting peninsula-wide operations.',
 'Network administration for US Forces Korea',
 'ACTIVE', true, 'admin_created'),

('Intelligence Analyst - North Korea', 'CACI International', 'Camp Humphreys, South Korea', true, 'INDOPACOM', 'OCONUS',
 'TS/SCI with CI Poly', 145000, 175000,
 'Provide strategic and tactical intelligence on North Korean military capabilities. Support combined US-ROK operations.',
 'North Korea intelligence analysis at USFK',
 'ACTIVE', true, 'admin_created'),

('Cybersecurity Engineer', 'Leidos', 'Osan Air Base, South Korea', true, 'INDOPACOM', 'OCONUS',
 'TS/SCI', 140000, 170000,
 'Design and implement defensive cyber capabilities for 7th Air Force. Lead incident response for classified networks.',
 'Cyber defense engineering for 7th Air Force',
 'ACTIVE', true, 'admin_created'),

('Help Desk Manager', 'Amentum', 'Camp Humphreys, South Korea', true, 'INDOPACOM', 'OCONUS',
 'Secret', 105000, 130000,
 'Manage IT help desk operations supporting 28,000+ personnel. Lead team of 15 technicians across multiple support tiers.',
 'Help desk management for USFK',
 'ACTIVE', true, 'admin_created'),

-- Japan
('Systems Engineer', 'ManTech', 'Yokota Air Base, Japan', true, 'INDOPACOM', 'OCONUS',
 'TS/SCI', 130000, 160000,
 'Provide systems engineering for Pacific Air Forces C2 systems. Support AOC modernization initiatives.',
 'C2 systems engineering at PACAF headquarters',
 'ACTIVE', true, 'admin_created'),

('SATCOM Field Engineer', 'Viasat Government', 'Kadena Air Base, Japan', true, 'INDOPACOM', 'OCONUS',
 'Secret', 120000, 150000,
 'Install and maintain satellite communication terminals. Provide 24/7 on-call support for mission-critical SATCOM.',
 'SATCOM support for Pacific operations',
 'ACTIVE', true, 'admin_created'),

('Intelligence Analyst - China', 'Booz Allen Hamilton', 'Yokosuka Naval Base, Japan', true, 'INDOPACOM', 'OCONUS',
 'TS/SCI with CI Poly', 150000, 180000,
 'Provide intelligence analysis on PLA Navy capabilities. Support 7th Fleet intelligence operations and planning.',
 'China maritime intelligence at 7th Fleet',
 'ACTIVE', true, 'admin_created'),

('Network Security Analyst', 'Peraton', 'Okinawa, Japan', true, 'INDOPACOM', 'OCONUS',
 'TS/SCI', 135000, 165000,
 'Monitor and defend Marine Corps networks in Pacific theater. Conduct threat hunting and vulnerability management.',
 'Network security for III MEF',
 'ACTIVE', true, 'admin_created'),

-- Guam
('Cloud Systems Administrator', 'General Dynamics IT', 'Andersen Air Force Base, Guam', true, 'INDOPACOM', 'OCONUS',
 'TS/SCI', 140000, 170000,
 'Manage cloud infrastructure supporting bomber operations. Implement zero-trust architecture for classified systems.',
 'Cloud administration for Pacific bomber operations',
 'ACTIVE', true, 'admin_created'),

('Cyber Threat Intelligence Analyst', 'CACI International', 'Guam', true, 'INDOPACOM', 'OCONUS',
 'TS/SCI', 145000, 175000,
 'Analyze advanced persistent threats targeting Pacific theater systems. Produce finished intelligence products.',
 'CTI analysis for INDOPACOM',
 'ACTIVE', true, 'admin_created');

-- AFRICOM Jobs (5 jobs)
INSERT INTO jobs (
  title, company, location, is_oconus, theater, location_type,
  clearance_required, salary_min, salary_max, description, snippet,
  status, is_active, source_type
) VALUES
('Intelligence Analyst - East Africa', 'SAIC', 'Camp Lemonnier, Djibouti', true, 'AFRICOM', 'OCONUS',
 'TS/SCI', 155000, 185000,
 'Provide intelligence analysis supporting counterterrorism operations in East Africa. Track Al-Shabaab and ISIS-affiliated groups.',
 'CT intelligence in East Africa',
 'ACTIVE', true, 'admin_created'),

('Network Engineer', 'KBR', 'Camp Lemonnier, Djibouti', true, 'AFRICOM', 'OCONUS',
 'Secret', 145000, 175000,
 'Manage network infrastructure in austere environment. Ensure connectivity for SOF and conventional forces.',
 'Network engineering at Camp Lemonnier',
 'ACTIVE', true, 'admin_created'),

('Cybersecurity Specialist', 'Leidos', 'Camp Lemonnier, Djibouti', true, 'AFRICOM', 'OCONUS',
 'TS/SCI', 150000, 180000,
 'Implement cybersecurity measures for expeditionary forces. Conduct security assessments and incident response.',
 'Cybersecurity for AFRICOM expeditionary ops',
 'ACTIVE', true, 'admin_created'),

('SATCOM Technician', 'Viasat Government', 'Camp Lemonnier, Djibouti', true, 'AFRICOM', 'OCONUS',
 'Secret', 135000, 165000,
 'Maintain satellite communication systems supporting Africa operations. Provide reach-back connectivity to CONUS.',
 'SATCOM support at Camp Lemonnier',
 'ACTIVE', true, 'admin_created'),

('IT Support Specialist', 'V2X', 'Camp Lemonnier, Djibouti', true, 'AFRICOM', 'OCONUS',
 'Secret', 115000, 145000,
 'Provide IT support for base operations and tenant commands. Troubleshoot in high-temperature, dusty environment.',
 'IT support in Djibouti',
 'ACTIVE', true, 'admin_created');

-- SOUTHCOM Jobs (4 jobs)
INSERT INTO jobs (
  title, company, location, is_oconus, theater, location_type,
  clearance_required, salary_min, salary_max, description, snippet,
  status, is_active, source_type
) VALUES
('Intelligence Analyst - Counternarcotics', 'CACI International', 'Soto Cano Air Base, Honduras', true, 'SOUTHCOM', 'OCONUS',
 'TS/SCI', 125000, 155000,
 'Provide intelligence analysis supporting counter-drug operations. Track transnational criminal organizations.',
 'Counter-narcotics intelligence in Honduras',
 'ACTIVE', true, 'admin_created'),

('Communications Specialist', 'L3Harris Technologies', 'Soto Cano Air Base, Honduras', true, 'SOUTHCOM', 'OCONUS',
 'Secret', 95000, 125000,
 'Maintain tactical radio systems for Joint Task Force Bravo. Support humanitarian assistance and disaster relief comms.',
 'Tactical communications at JTF-Bravo',
 'ACTIVE', true, 'admin_created'),

('Network Administrator', 'Amentum', 'Guantanamo Bay Naval Base, Cuba', true, 'SOUTHCOM', 'OCONUS',
 'Secret', 110000, 140000,
 'Manage network infrastructure for naval base operations. Isolated environment requires independent problem-solving.',
 'Network administration at GTMO',
 'ACTIVE', true, 'admin_created'),

('IT Security Analyst', 'ManTech', 'Guantanamo Bay Naval Base, Cuba', true, 'SOUTHCOM', 'OCONUS',
 'TS/SCI', 130000, 160000,
 'Implement security controls for detention operations network. Ensure compliance with DoD security standards.',
 'IT security at GTMO',
 'ACTIVE', true, 'admin_created');
```

---

## Appendix B: Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `app/pages/oconus/index.vue` | OCONUS overview page |
| `app/pages/oconus/[theater].vue` | Theater landing page |
| `app/pages/oconus/[theater]/[country].vue` | Country page |
| `app/pages/oconus/[theater]/bases/[slug].vue` | Base detail page |
| `app/components/Theater/TheaterSelector.vue` | Theater selection component |
| `app/components/Theater/TheaterCard.vue` | Theater display card |
| `app/components/Theater/TheaterStats.vue` | Theater statistics |
| `app/composables/useTheaters.ts` | Theater data composable |
| `app/composables/useBases.ts` | Base data composable |
| `server/api/theaters/index.get.ts` | List theaters API |
| `server/api/theaters/[code].get.ts` | Theater detail API |
| `server/api/bases/index.get.ts` | List bases API |
| `server/api/bases/[slug].get.ts` | Base detail API |

### Modified Files

| File | Changes |
|------|---------|
| `app/pages/index.vue` | OCONUS-focused homepage |
| `app/pages/search.vue` | Add theater filters |
| `app/components/Jobs/JobCard.vue` | Theater badges |
| `app/components/Jobs/JobFilters.vue` | Theater/country filters |
| `app/components/Search/SearchInput.vue` | Theater context |
| `app/composables/useJobs.ts` | Filter by theater |
| `server/api/jobs/index.get.ts` | Theater filtering |
| `server/api/search.get.ts` | Theater in search params |

---

## Appendix C: Success Metrics

| Metric | Current | Target (3 months) |
|--------|---------|-------------------|
| Total OCONUS jobs | 13 | 500+ |
| Theaters with jobs | 3 | 5 |
| Job alert signups | ~10/month | 100/month |
| Placement consent rate | 20% | 40% |
| Organic search traffic (OCONUS terms) | ~0 | 500/month |
| Placements | 0 | 2-3 |

---

## Appendix D: Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Limited OCONUS job supply | Focus scrapers on OCONUS-heavy employers (KBR, V2X, Amentum) |
| Candidates want CONUS too | Clear messaging: "We specialize in OCONUS. For CONUS, try ClearanceJobs." |
| Employer relationships harder | Lead with value: "We have OCONUS-ready candidates you can't find elsewhere" |
| SEO takes time | Invest in theater/base landing pages for long-tail keywords |

---

## Next Steps

1. **Approve plan** — Review with stakeholder
2. **Phase A kickoff** — Create migrations, seed data
3. **Weekly check-ins** — Track progress against phases
4. **Launch announcement** — Once Phase B complete, soft launch OCONUS positioning


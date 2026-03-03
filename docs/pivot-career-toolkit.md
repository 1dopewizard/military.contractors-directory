# Pivot: MOS-Powered Career Toolkit

> **Status:** Planning  
> **Created:** 2026-01-18  
> **Last Updated:** 2026-01-18

## Executive Summary

Transform `military.contractors` from a company directory into an **AI-powered career toolkit** for transitioning military veterans. Users enter their MOS and receive personalized, AI-generated career guidance — no external content dependencies, immediate value on day one.

**Tagline options:**

- "Your AI-powered transition toolkit"
- "From MOS to career — powered by AI"
- "The smartest way to translate your military experience"

---

## The Problem

1. **Military resumes don't translate** — Jargon like "NIPR/SIPR" and "DISA STIGs" means nothing to civilian employers
2. **Veterans don't know what to do next** — They know their MOS but not which certifications, roles, or companies to target
3. **Generic advice doesn't help** — "Update your LinkedIn" isn't actionable when you don't know how to describe your experience
4. **Existing tools ignore military context** — ChatGPT doesn't understand that a 25B is basically a Network Admin

---

## The Solution

A suite of AI-powered tools that leverage our **MOS ontology** (1,317 codes with enriched data) to provide personalized career guidance.

### Core Tools

#### 1. Resume Translator

**Input:** MOS + military experience bullets (pasted text)  
**Output:** Civilian-translated content with:

- De-jargoned bullet points
- Quantified achievements
- ATS-optimized keywords
- Suggested job titles

#### 2. Career Roadmap Generator

**Input:** MOS + clarifying questions (experience, clearance, goals)  
**Output:** Personalized plan including:

- Target roles ranked by fit
- Salary expectations by location
- Certification roadmap (prioritized)
- Timeline to achieve goals
- Company recommendations with reasoning

#### 3. Interview Prep Coach

**Input:** MOS + target role/company  
**Output:** Interview preparation:

- Technical questions with sample answers
- Behavioral questions with STAR examples from military context
- Questions to ask the interviewer
- (Premium) Mock interview mode with AI feedback

#### 4. Salary Calculator

**Input:** MOS + clearance + location + experience  
**Output:** Market rate estimate:

- Salary range for your profile
- Premium for clearance level
- CONUS vs OCONUS comparison
- Negotiation talking points

---

## User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         HOMEPAGE                                 │
│                                                                  │
│     "What's your MOS?"                                          │
│     ┌──────────────────────────────────┐                        │
│     │  25B                             │  [Get Started →]       │
│     └──────────────────────────────────┘                        │
│                                                                  │
│     "Get your personalized transition plan in 60 seconds"       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MOS RESOLVED                                │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  25B — Information Technology Specialist (Army)          │    │
│  │  Category: IT/Cyber | Clearance: Typically TS/SCI       │    │
│  │  Civilian Equivalents: Network Admin, Systems Admin...   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Choose a tool:                                                  │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Resume     │  │   Career     │  │  Interview   │          │
│  │  Translator  │  │   Roadmap    │  │    Prep      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │   Salary     │  │  Companies   │                             │
│  │ Calculator   │  │  That Hire   │                             │
│  └──────────────┘  └──────────────┘                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Why This Works

| Factor                       | Benefit                                                       |
| ---------------------------- | ------------------------------------------------------------- |
| **Day-one value**            | No external content dependencies — works immediately          |
| **MOS ontology is the moat** | 1,317 codes with skills, certs, career paths power the AI     |
| **Solves real pain**         | Resume translation is a universal need for transitioning vets |
| **Repeat engagement**        | Multiple tools bring users back                               |
| **Clear monetization**       | Free tier hooks, premium tier converts                        |
| **Viral potential**          | Useful tools get shared in military communities               |
| **Domain fit**               | "military.contractors" = helping military get contractor jobs |

---

## Monetization

### Pricing Tiers

| Tier         | Price        | Features                                                                           |
| ------------ | ------------ | ---------------------------------------------------------------------------------- |
| **Free**     | $0           | 1 resume translation, basic career snapshot, 5 interview questions                 |
| **Pro**      | $19/month    | Unlimited translations, full roadmaps, mock interviews, PDF exports, saved history |
| **Lifetime** | $99 one-time | Everything forever (appeals to transitioning vets with limited-time need)          |

### Revenue Projections (Conservative)

| Metric               | Month 3 | Month 6 | Month 12 |
| -------------------- | ------- | ------- | -------- |
| Monthly visitors     | 1,000   | 5,000   | 15,000   |
| Free signups         | 200     | 1,000   | 3,000    |
| Pro conversions (5%) | 10      | 50      | 150      |
| Monthly revenue      | $190    | $950    | $2,850   |
| Lifetime purchases   | 5       | 25      | 75       |
| Lifetime revenue     | $495    | $2,475  | $7,425   |

---

## Technical Architecture

### Existing Infrastructure (Reusable)

- **MOS ontology** — 1,317 codes with enriched data (skills, certs, career paths)
- **Company data** — 33 contractors with domains, theaters, MOS mappings
- **Convex backend** — Real-time database, functions, auth-ready
- **Nuxt 4 frontend** — SSR, composables, shadcn-vue components
- **OpenAI integration** — Already used for MOS enrichment pipeline

### New Components Needed

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend                                  │
├─────────────────────────────────────────────────────────────────┤
│  pages/                                                          │
│  ├── index.vue (MOS input hero)                                 │
│  ├── tools/                                                      │
│  │   ├── resume.vue (Resume Translator)                         │
│  │   ├── roadmap.vue (Career Roadmap)                           │
│  │   ├── interview.vue (Interview Prep)                         │
│  │   └── salary.vue (Salary Calculator)                         │
│  ├── pricing.vue                                                │
│  └── account/                                                    │
│      ├── history.vue (saved generations)                        │
│      └── subscription.vue                                        │
│                                                                  │
│  composables/                                                    │
│  ├── useResumeTranslator.ts                                     │
│  ├── useCareerRoadmap.ts                                        │
│  ├── useInterviewPrep.ts                                        │
│  └── useSalaryCalculator.ts                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend (Nuxt Server)                     │
├─────────────────────────────────────────────────────────────────┤
│  server/api/                                                     │
│  ├── tools/                                                      │
│  │   ├── resume.post.ts (AI resume translation)                 │
│  │   ├── roadmap.post.ts (AI career roadmap)                    │
│  │   ├── interview.post.ts (AI interview prep)                  │
│  │   └── salary.post.ts (salary calculation)                    │
│  └── billing/                                                    │
│      ├── checkout.post.ts (Stripe checkout)                     │
│      └── webhook.post.ts (Stripe webhooks)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Convex (Database)                         │
├─────────────────────────────────────────────────────────────────┤
│  New tables:                                                     │
│  ├── generations (saved AI outputs per user)                    │
│  ├── subscriptions (user subscription status)                   │
│  └── usageTracking (free tier limits)                           │
│                                                                  │
│  Existing tables (reused):                                       │
│  ├── mosCodes (ontology)                                        │
│  ├── companies (for recommendations)                            │
│  ├── companyMos (for company matching)                          │
│  └── users (Better Auth integration)                            │
└─────────────────────────────────────────────────────────────────┘
```

### AI Prompts (Conceptual)

#### Resume Translator Prompt

```
You are an expert military-to-civilian resume translator. You understand
all military occupational specialties and how they map to civilian roles.

The user has MOS: {mos_code} ({mos_name}) from the {branch}.

Key skills for this MOS: {core_skills}
Civilian equivalent roles: {civilian_roles}
Common certifications: {common_certs}

Translate the following military experience into civilian-friendly language:
- Remove all military jargon and acronyms
- Quantify achievements where possible
- Use keywords that ATS systems look for
- Suggest relevant job titles

Military experience:
{user_input}

Provide:
1. Translated bullet points (3-5)
2. Suggested job titles (3-5)
3. Keywords to include
4. Brief explanation of translation choices
```

#### Career Roadmap Prompt

```
You are a career advisor specializing in military-to-civilian transitions,
particularly into the defense contracting industry.

User profile:
- MOS: {mos_code} ({mos_name}) — {branch}
- Years of experience: {years}
- Current clearance: {clearance}
- Location preference: {location}
- Priority: {priority} (salary/location/mission/work-life)

MOS data:
- Core skills: {core_skills}
- Civilian roles: {civilian_roles}
- Recommended certs: {common_certs}
- Typical clearance: {clearance_profile}
- Pay band: {pay_band_hint}

Companies with strong match for this MOS:
{company_matches}

Generate a personalized 12-month career roadmap including:
1. Immediate actions (first 30 days)
2. Certification priorities (in order)
3. Target roles with salary ranges
4. Company recommendations with reasoning
5. Timeline milestones
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

- [ ] New homepage with MOS input hero
- [ ] MOS resolution page (shows MOS details + tool options)
- [ ] Basic Resume Translator (no auth, no limits initially)
- [ ] OpenAI API integration for translations

### Phase 2: Core Tools (Week 3-4)

- [ ] Career Roadmap generator
- [ ] Interview Prep (basic question generation)
- [ ] Salary Calculator (using MOS pay band data)
- [ ] Polish UI/UX for all tools

### Phase 3: Auth & Limits (Week 5-6)

- [ ] Better Auth integration (if not already done)
- [ ] Usage tracking (free tier limits)
- [ ] Saved generations (history)
- [ ] User dashboard

### Phase 4: Monetization (Week 7-8)

- [ ] Stripe integration
- [ ] Pricing page
- [ ] Pro tier features unlock
- [ ] Lifetime purchase option

### Phase 5: Growth (Ongoing)

- [ ] Mock interview mode (premium)
- [ ] PDF export for resumes
- [ ] Email capture / job alerts
- [ ] SEO pages for each MOS (auto-generated)

---

## Success Metrics

### User Engagement

| Metric                    | Target (Month 3) |
| ------------------------- | ---------------- |
| MOS searches / day        | 50+              |
| Resume translations / day | 20+              |
| Roadmaps generated / day  | 10+              |
| Return visitor rate       | 30%+             |

### Revenue

| Metric             | Target (Month 6) |
| ------------------ | ---------------- |
| Pro subscribers    | 50+              |
| MRR                | $950+            |
| Lifetime purchases | 25+              |

### Growth

| Metric            | Target (Month 12) |
| ----------------- | ----------------- |
| Monthly visitors  | 15,000+           |
| Email subscribers | 3,000+            |
| Pro subscribers   | 150+              |
| MRR               | $2,850+           |

---

## Risks & Mitigations

| Risk                       | Impact                  | Mitigation                                                          |
| -------------------------- | ----------------------- | ------------------------------------------------------------------- |
| AI output quality varies   | Users lose trust        | Prompt engineering, output review, user feedback loop               |
| Low conversion to paid     | No revenue              | Strong free tier hooks, clear value upgrade path                    |
| Competition copies model   | Reduced differentiation | Move fast, build brand, deepen MOS data                             |
| OpenAI costs spike         | Margin pressure         | Caching common queries, output length limits, consider alternatives |
| Veterans prefer free tools | Low revenue             | Lifetime deal appeals to budget-conscious, strong ROI messaging     |

---

## Competitive Landscape

| Competitor      | What They Do        | Our Advantage                                       |
| --------------- | ------------------- | --------------------------------------------------- |
| ChatGPT         | Generic AI          | MOS-specific context, pre-loaded military knowledge |
| Resume.io       | Resume builder      | Military translation, MOS-aware suggestions         |
| LinkedIn        | Career platform     | Specialized for military→contractor transition      |
| Skillbridge     | Transition programs | On-demand, no application required                  |
| Hire Heroes USA | Nonprofit support   | Instant AI access vs. waiting for human coach       |

---

## Monorepo Structure: mos.directory + military.contractors

Both sites remain in the same monorepo, sharing infrastructure and data while serving distinct purposes.

### Site Responsibilities

| Site                     | Purpose          | Primary Content                     |
| ------------------------ | ---------------- | ----------------------------------- |
| **mos.directory**        | MOS Encyclopedia | Informational — "What is this MOS?" |
| **military.contractors** | Career Toolkit   | Transactional — "Help me get a job" |

### mos.directory Changes

With the pivot, `mos.directory` absorbs the company-MOS data that was the core of `military.contractors`:

**Each MOS page gains:**

```
/army/25B
├── Overview (existing)
├── Skills & Certifications (existing)
├── Career Paths (existing)
├── Companies That Hire 25B          ← NEW (from military.contractors)
│   ├── Strong Matches (CACI, Leidos, ManTech)
│   ├── Good Matches (KBR, SAIC, Booz Allen)
│   └── Direct links to careers sites
└── Resources (existing)
```

**CTA to military.contractors:**

```
┌────────────────────────────────────────────────────────────────┐
│  Ready to transition?                                          │
│                                                                │
│  Get your personalized career plan, translate your resume,    │
│  and prep for interviews — powered by AI.                     │
│                                                                │
│  [→ Launch Career Toolkit on military.contractors]            │
└────────────────────────────────────────────────────────────────┘
```

### military.contractors Changes

Becomes a focused AI toolkit — no longer a company directory:

- **Removes:** Company browse pages, company detail pages, company search
- **Keeps:** MOS resolution, company data (used in AI recommendations)
- **Adds:** Resume Translator, Career Roadmap, Interview Prep, Salary Calculator

### Shared Infrastructure

```
monorepo/
├── apps/
│   ├── contractors/        ← military.contractors (AI toolkit)
│   │   ├── convex/         ← Shared Convex backend
│   │   └── ...
│   └── directory/          ← mos.directory (MOS encyclopedia)
│       ├── convex → symlink to contractors/convex
│       └── ...
├── packages/
│   └── shared-types/       ← Shared TypeScript types
└── server-python/          ← MOS enrichment pipeline (serves both)
```

**Shared resources:**

- **Convex database** — Both apps read from the same `mosCodes`, `companies`, `companyMos` tables
- **MOS enrichment pipeline** — Python pipeline enriches MOS data for both sites
- **Shared types** — TypeScript types in `packages/shared-types`

### User Journey (Cross-Site)

```
Google: "What is MOS 25B?"
         │
         ▼
┌─────────────────────────────────────┐
│       mos.directory/army/25B        │
│                                     │
│  • MOS overview                     │
│  • Skills, certs, career paths      │
│  • Companies that hire 25B ← NEW    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Ready to transition?        │    │
│  │ [→ Career Toolkit]          │────┼──────┐
│  └─────────────────────────────┘    │      │
└─────────────────────────────────────┘      │
                                             ▼
                              ┌─────────────────────────────────────┐
                              │     military.contractors            │
                              │                                     │
                              │  MOS: 25B (pre-filled from referral)│
                              │                                     │
                              │  • Resume Translator                │
                              │  • Career Roadmap                   │
                              │  • Interview Prep                   │
                              │  • Salary Calculator                │
                              └─────────────────────────────────────┘
```

### SEO Strategy (Dual-Site)

| Intent        | Site                 | Example Query                                       |
| ------------- | -------------------- | --------------------------------------------------- |
| Informational | mos.directory        | "What is 25B MOS", "Army IT jobs"                   |
| Transactional | military.contractors | "Military resume translator", "MOS career advice"   |
| Commercial    | military.contractors | "Defense contractor salary", "Veteran career tools" |

**Cross-linking benefits:**

- mos.directory builds authority on informational queries (1,317 MOS pages)
- Passes "ready to act" traffic to military.contractors
- military.contractors focuses on conversion, not SEO breadth

### Implementation Notes

1. **mos.directory updates:**
   - Add `CompaniesHiringSection.vue` component to MOS detail pages
   - Add CTA banner linking to military.contractors
   - Query `companyMos` table to show company matches

2. **military.contractors updates:**
   - Remove `/companies` routes and components
   - Keep company data in Convex (used by AI for recommendations)
   - Add referral parameter handling (`?mos=25B` pre-fills MOS)

3. **Shared Convex:**
   - Both apps use the same Convex deployment
   - mos.directory reads `mosCodes`, `companies`, `companyMos`
   - military.contractors reads same + writes to `generations`, `subscriptions`

---

## Open Questions

1. **Company data in military.contractors — visible or hidden?**
   - Option A: Remove company UI entirely, data only powers AI recommendations
   - Option B: Keep a simple "Companies That Hire Your MOS" as one tool (alongside Resume, Roadmap, etc.)
   - _Recommendation:_ Option A — let mos.directory own company browsing, military.contractors focuses on AI tools

2. **Free tier limits — how generous?**
   - Too restrictive → users leave
   - Too generous → no conversions
   - _Suggestion:_ 2 resume translations, 1 roadmap, 10 interview questions per month

3. **Lifetime vs subscription — which to emphasize?**
   - Lifetime is simpler for users, one-time revenue
   - Subscription is recurring but may feel expensive for short-term need
   - _Suggestion:_ Emphasize Lifetime ($99) for transitioning vets, keep Pro ($19/mo) for power users

4. **Referral tracking from mos.directory?**
   - Should we track which MOS pages drive the most conversions?
   - Could inform which MOS pages to prioritize for SEO

5. **Pre-fill MOS from mos.directory referral?**
   - When user clicks CTA on mos.directory, pass MOS code in URL
   - military.contractors skips MOS input step, goes straight to tool selection
   - _Suggestion:_ Yes — reduces friction, better UX

---

## Related Documentation

- `prd.md` — Original product requirements (company-first model, to be archived)
- `docs/database-schema.md` — Convex schema reference
- `server-python/pipeline/README.md` — MOS enrichment pipeline
- `.factory/skills/` — Development patterns and templates
- `apps/directory/` — mos.directory codebase (sister site, shares Convex)

---

## Next Steps

1. Review and refine this document
2. Decide on open questions
3. Create detailed wireframes/mockups
4. Begin Phase 1 implementation

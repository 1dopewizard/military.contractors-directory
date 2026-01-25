---
name: SEO Enhancement Phase
overview: "Comprehensive update: SEO browse pages, claimed profiles system, sponsored content, employer dashboard, admin dashboard overhaul, and cleanup of unused features. Ready for monetization from day 1."
todos:
  - id: claimed-schema
    content: Create claimed profiles and sponsored content database schema
    status: pending
  - id: employer-dashboard
    content: Build employer dashboard for profile claiming and content management
    status: pending
  - id: admin-dashboard
    content: Overhaul admin dashboard for site management and claim approvals
    status: pending
  - id: profile-enhancements
    content: Update contractor profile page to display claimed/sponsored content sections
    status: pending
  - id: seed-sponsored
    content: Seed 3 companies with demo sponsored content
    status: pending
  - id: structured-data
    content: Add useOrganizationSchema and useBreadcrumbSchema to contractor profile page
    status: pending
  - id: specialty-pages
    content: Create /contractors/specialty/[slug] pages with API endpoint
    status: pending
  - id: location-pages
    content: Create /contractors/location/[state] pages with API endpoints
    status: pending
  - id: top-list-page
    content: Create /top-defense-contractors SEO list page
    status: pending
  - id: logo-integration
    content: Configure logoUrl to use public/logos/companies/ and display in UI
    status: pending
  - id: cleanup-dashboards
    content: Remove recruiter, advertiser, jobs pages and unused dashboard components
    status: pending
  - id: remove-community
    content: Remove community pages, components, composables, and APIs (salaries, interviews, community)
    status: pending
  - id: employer-landing
    content: Repurpose /advertise as /for-employers landing page for claimed profiles
    status: pending
  - id: internal-linking
    content: Add related contractors section and cross-link specialty badges
    status: pending
isProject: false
---

# Defense Contractor Directory - Complete Implementation

## Overview

Comprehensive implementation covering:

1. **Claimed Profiles System** - Companies can claim and manage their profiles
2. **Sponsored Content** - Premium content sections for paying employers
3. **Two Dashboards Only** - Admin (site management) and Employer (profile management)
4. **SEO Pages** - Specialty, location, and top contractors pages
5. **Cleanup** - Remove jobs, community, recruiter, advertiser features

---

## Phase 1: Database Schema

### 1.1 Claimed Profiles Schema

**New file: [server/database/schema/claimed.ts](server/database/schema/claimed.ts)**

```typescript
// Claimed profile - links a user to a contractor they manage
claimedProfile table:
- id (PK)
- contractorId (FK to contractor, unique)
- userId (FK to user who claimed)
- tier: 'claimed' | 'premium' | 'enterprise'
- status: 'pending' | 'active' | 'suspended'
- verifiedAt (timestamp)
- verificationMethod: 'email_domain' | 'manual' | 'document'
- monthlyPrice (integer, cents)
- billingStartedAt
- createdAt, updatedAt

// Employer users - users who can manage claimed profiles
employerUser table:
- id (PK)
- userId (FK to user)
- claimedProfileId (FK to claimedProfile)
- role: 'owner' | 'admin' | 'editor'
- invitedBy (FK to user, nullable)
- createdAt
```

### 1.2 Sponsored Content Schema

```typescript
// Sponsored content blocks on profile pages
sponsoredContent table:
- id (PK)
- claimedProfileId (FK)
- type: 'spotlight' | 'why_work_here' | 'testimonial' | 'programs'
- status: 'draft' | 'pending_review' | 'approved' | 'rejected'
- title (text)
- content (text, structured JSON for type-specific fields)
- mediaUrl (optional)
- ctaText, ctaUrl (optional)
- reviewedBy (FK to admin user, nullable)
- reviewedAt, rejectionReason
- createdAt, updatedAt

// "Why Work Here" benefits (structured)
employerBenefit table:
- id (PK)
- claimedProfileId (FK)
- icon (iconify icon name)
- title (text, 50 chars)
- description (text, 150 chars)
- sortOrder (integer)

// Notable programs/products
employerProgram table:
- id (PK)
- claimedProfileId (FK)
- name (text)
- category (text)
- description (text, 200 chars)
- imageUrl (optional)
- sortOrder (integer)

// Employee testimonials
employerTestimonial table:
- id (PK)
- claimedProfileId (FK)
- quote (text, 300 chars)
- employeeName (text)
- employeeTitle (text)
- employeePhotoUrl (optional)
- status: 'pending' | 'approved' | 'rejected'
```

### 1.3 Update Schema Index

Add to [server/database/schema/index.ts](server/database/schema/index.ts):

```typescript
export * from './claimed'
```

### 1.4 Generate Migration

Run `pnpm db:generate` and `pnpm db:migrate`

---

## Phase 2: Employer Dashboard

### 2.1 Dashboard Pages

**New file: [app/pages/employer/index.vue](app/pages/employer/index.vue)**

Main employer dashboard with:

- Overview of claimed profile status
- Quick stats (views, clicks)
- Navigation to profile management sections

**New file: [app/pages/employer/profile.vue](app/pages/employer/profile.vue)**

Profile editing form (structured fields):

- Logo upload
- Tagline (150 chars)
- Description (2000 chars)
- Headquarters, employee count, founded
- Website, careers URL, LinkedIn
- Locations management

**New file: [app/pages/employer/content.vue](app/pages/employer/content.vue)**

Sponsored content management:

- "Why Work Here" benefits (3 items with icons)
- Notable programs (up to 5)
- Spotlight content block (Premium tier only)
- Testimonials (Premium tier only)

**New file: [app/pages/employer/analytics.vue](app/pages/employer/analytics.vue)**

Profile analytics:

- Views, clicks, search appearances
- Traffic sources
- Trend charts

**New file: [app/pages/employer/claim.vue](app/pages/employer/claim.vue)**

Claim flow for unclaimed profiles:

- Search for contractor
- Verify ownership (email domain match or manual review)
- Select tier
- Payment setup (placeholder for now)

### 2.2 Employer Dashboard Components

**New directory: [app/components/Dashboard/Employer/](app/components/Dashboard/Employer/)**

- `EmployerOverview.vue` - Dashboard home with stats
- `EmployerProfileForm.vue` - Structured profile editing
- `EmployerBenefitsEditor.vue` - "Why Work Here" editor
- `EmployerProgramsEditor.vue` - Notable programs editor
- `EmployerSpotlightEditor.vue` - Spotlight content (Premium)
- `EmployerTestimonialsEditor.vue` - Testimonials (Premium)
- `EmployerAnalytics.vue` - Analytics display
- `EmployerTierBadge.vue` - Shows current tier
- `EmployerClaimFlow.vue` - Claim wizard

### 2.3 Employer Middleware

**New file: [app/middleware/employer.ts](app/middleware/employer.ts)**

- Verify user has employer role
- Verify user is linked to a claimed profile
- Redirect to claim flow if not

### 2.4 Employer API Endpoints

**New directory: [server/api/employer/](server/api/employer/)**

- `profile.get.ts` - Get employer's claimed profile
- `profile.patch.ts` - Update profile fields
- `benefits.get.ts` / `benefits.post.ts` / `benefits.delete.ts`
- `programs.get.ts` / `programs.post.ts` / `programs.delete.ts`
- `spotlight.get.ts` / `spotlight.post.ts` - Spotlight content
- `testimonials.get.ts` / `testimonials.post.ts`
- `analytics.get.ts` - Profile analytics
- `claim.post.ts` - Initiate claim process

---

## Phase 3: Admin Dashboard Overhaul

### 3.1 Simplified Admin Pages

Keep [app/pages/admin/index.vue](app/pages/admin/index.vue) but restructure:

**Sections:**

1. **Overview** - Site stats, recent activity
2. **Claims** - Pending claim requests to review
3. **Content Review** - Sponsored content pending approval
4. **Contractors** - Manage contractor profiles
5. **Users** - User management

### 3.2 Admin Components to Keep/Update

**Keep and update:**

- `AdminOverview.vue` - Update for directory metrics
- `UserManagementTable.vue` - Keep for user admin

**New components:**

- `AdminClaimReview.vue` - Review/approve claim requests
- `AdminContentReview.vue` - Review/approve sponsored content
- `AdminContractorList.vue` - Manage contractor profiles

**Remove:**

- `AdminAdReview.vue`
- `AdminCandidates.vue`
- `AdminCompanySpotlights.vue`
- `AdminFeaturedJobs.vue`
- `AdminFeaturedListings.vue`
- `AdminHRContacts.vue`
- `AdminPipeline.vue` (entire Pipeline/ subdirectory)
- `AdminSearch.vue`
- `AdminRecruitersList.vue`

### 3.3 Admin API Endpoints

**New/update [server/api/admin/](server/api/admin/):**

- `claims/index.get.ts` - List pending claims
- `claims/[id].patch.ts` - Approve/reject claim
- `content/index.get.ts` - List pending content
- `content/[id].patch.ts` - Approve/reject content
- `contractors/index.get.ts` - List all contractors
- `contractors/[id].patch.ts` - Edit contractor

---

## Phase 4: Profile Page Enhancements

### 4.1 Update Contractor Profile

**Update [app/pages/contractors/[slug].vue](app/pages/contractors/[slug].vue):**

Add conditional sections for claimed profiles:

```vue
<!-- Verified badge if claimed -->
<Badge v-if="contractor.claimedProfile" variant="success">
  <Icon name="mdi:check-decagram" /> Verified Employer
</Badge>

<!-- Why Work Here section (if benefits exist) -->
<section v-if="contractor.benefits?.length">
  <h2>Why Work Here</h2>
  <div class="grid grid-cols-3 gap-4">
    <div v-for="benefit in contractor.benefits">
      <Icon :name="benefit.icon" />
      <h3>{{ benefit.title }}</h3>
      <p>{{ benefit.description }}</p>
    </div>
  </div>
</section>

<!-- Notable Programs (if programs exist) -->
<section v-if="contractor.programs?.length">
  <h2>Notable Programs</h2>
  ...
</section>

<!-- Spotlight (Premium, if exists) -->
<section v-if="contractor.spotlight" class="border-primary">
  <Badge>Company Spotlight</Badge>
  <h2>{{ contractor.spotlight.title }}</h2>
  <p>{{ contractor.spotlight.content }}</p>
  <img v-if="contractor.spotlight.mediaUrl" :src="contractor.spotlight.mediaUrl" />
  <Button v-if="contractor.spotlight.ctaUrl" :href="contractor.spotlight.ctaUrl">
    {{ contractor.spotlight.ctaText }}
  </Button>
</section>

<!-- Testimonials (Premium, if exist) -->
<section v-if="contractor.testimonials?.length">
  <h2>What Employees Say</h2>
  ...
</section>
```

### 4.2 Update Contractor API

**Update [server/api/contractors/[slug].get.ts](server/api/contractors/[slug].get.ts):**

Include claimed profile data:

- `claimedProfile` object (tier, verifiedAt)
- `benefits` array
- `programs` array
- `spotlight` object (if approved)
- `testimonials` array (if approved)

---

## Phase 5: Seed Demo Data

### 5.1 Seed Sponsored Content

**New file: [scripts/seed/seed-claimed-profiles.ts](scripts/seed/seed-claimed-profiles.ts)**

Seed 3 companies with full sponsored content for demo:

1. **Lockheed Martin** (Premium tier)

   - Verified badge
   - 3 "Why Work Here" benefits
   - 3 notable programs (F-35, F-22, etc.)
   - Spotlight content block
   - 2 employee testimonials

2. **CACI** (Claimed tier)

   - Verified badge
   - 3 "Why Work Here" benefits
   - 2 notable programs

3. **Booz Allen Hamilton** (Premium tier)

   - Verified badge
   - 3 "Why Work Here" benefits
   - 4 notable programs
   - Spotlight content block
   - 1 employee testimonial

Create test admin user and test employer users linked to these profiles.

---

## Phase 6: SEO Pages

### 6.1 Specialty Browse Pages

**New file: [app/pages/contractors/specialty/[slug].vue](app/pages/contractors/specialty/[slug].vue)**

- Fetch specialty by slug
- List contractors in that specialty
- SEO meta: "Cybersecurity Defense Contractors"
- Structured data: `CollectionPage`

**New API: [server/api/specialties/[slug].get.ts](server/api/specialties/[slug].get.ts)**

### 6.2 Location Browse Pages

**New file: [app/pages/contractors/location/[state].vue](app/pages/contractors/location/[state].vue)**

- Fetch contractors by state
- SEO meta: "Defense Contractors in Virginia"

**New API: [server/api/contractors/by-location/[state].get.ts](server/api/contractors/by-location/[state].get.ts)**

**New API: [server/api/locations/index.get.ts](server/api/locations/index.get.ts)**

### 6.3 Top Contractors Page

**New file: [app/pages/top-defense-contractors.vue](app/pages/top-defense-contractors.vue)**

- Numbered list by Defense News rank
- SEO meta: "Top Defense Contractors 2025"
- Structured data: `ItemList`

### 6.4 Structured Data

**Update [app/pages/contractors/[slug].vue](app/pages/contractors/[slug].vue):**

```typescript
useOrganizationSchema(contractor)
useBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Contractors', url: '/contractors' },
  { name: contractor.value.name, url: `/contractors/${contractor.value.slug}` }
])
```

---

## Phase 7: Cleanup

### 7.1 Pages to Remove

- `app/pages/jobs/index.vue`
- `app/pages/jobs/[id].vue`
- `app/pages/recruiter/index.vue`
- `app/pages/advertiser/index.vue`
- `app/pages/employers/index.vue`
- `app/pages/salaries/index.vue`
- `app/pages/salaries/submit.vue`
- `app/pages/interviews/index.vue`
- `app/pages/interviews/submit.vue`
- `app/pages/community/index.vue`
- `app/pages/contracts/index.vue`

### 7.2 Components to Remove

- `app/components/Dashboard/Advertiser/*` (entire directory)
- `app/components/Dashboard/Admin/Pipeline/*` (entire directory)
- `app/components/Dashboard/Admin/AdminFeaturedJobs.vue`
- `app/components/Dashboard/Admin/AdminFeaturedListings.vue`
- `app/components/Dashboard/Admin/AdminAdReview.vue`
- `app/components/Dashboard/Admin/AdminCandidates.vue`
- `app/components/Dashboard/Admin/AdminHRContacts.vue`
- `app/components/Dashboard/Admin/AdminPipeline.vue`
- `app/components/Dashboard/Admin/AdminSearch.vue`
- `app/components/Dashboard/Admin/Recruiters/*`
- `app/components/Community/*` (entire directory)
- `app/components/Jobs/*` (entire directory)
- `app/components/Featured/*` (entire directory)

### 7.3 Composables to Remove

- `app/composables/useJobs.ts`
- `app/composables/useSalaryReports.ts`
- `app/composables/useInterviewExperiences.ts`
- `app/composables/useCommunityAccess.ts`
- `app/composables/useCommunityStats.ts`
- `app/composables/useJobAlerts.ts`
- `app/composables/useJobDetail.ts`
- `app/composables/usePipelineJobs.ts`
- `app/composables/useScrapedJobs.ts`
- `app/composables/useFeaturedListings.ts`
- `app/composables/useFeaturedAdmin.ts`

### 7.4 API Endpoints to Remove

- `server/api/jobs/*`
- `server/api/ads/*`
- `server/api/community/*` (if exists)
- `server/api/salaries/*` (if exists)
- `server/api/interviews/*` (if exists)

### 7.5 Schema Tables to Keep but Not Use

Keep these tables in schema (for data preservation) but remove from active use:

- `server/database/schema/jobs.ts` - Keep schema, remove API/UI
- `server/database/schema/community.ts` - Keep schema, remove API/UI
- `server/database/schema/campaigns.ts` - Keep schema (may reuse for claimed profiles billing)

### 7.6 Navigation Updates

Update layouts to remove links to deleted pages:

- Remove Jobs from navigation
- Remove Community from navigation
- Add Employer Dashboard link (for logged-in employers)

---

## Phase 8: Employer Landing Page

### 8.1 Repurpose /advertise

**Rename/update [app/pages/advertise/index.vue](app/pages/advertise/index.vue) to [app/pages/for-employers/index.vue](app/pages/for-employers/index.vue)**

Marketing landing page for claimed profiles:

**Hero Section:**

- Headline: "Claim Your Company Profile"
- Subhead: "Stand out to job seekers researching defense contractors"
- CTA: "Get Started" → /employer/claim

**Benefits Section:**

- "Verified Employer" badge builds trust
- Control your company narrative
- Showcase culture and programs
- Analytics on profile views

**Tier Comparison:**

- Table showing Free vs Claimed ($149) vs Premium ($399)
- Feature breakdown matching the tier matrix

**How It Works:**

1. Search for your company
2. Verify your identity (email domain or manual review)
3. Choose your tier
4. Start managing your profile

**Social Proof (placeholder for now):**

- "Join companies like Lockheed Martin and CACI"
- Testimonials from claimed employers (once available)

**Final CTA:**

- "Claim Your Profile Today"
- Link to /employer/claim

### 8.2 Update Navigation

- Change "Advertise" link to "For Employers" → /for-employers
- Remove old /advertise route

### 8.3 Unclaimed Profile CTA

**Update [app/pages/contractors/[slug].vue](app/pages/contractors/[slug].vue):**

For unclaimed profiles, show subtle CTA:

```vue
<div v-if="!contractor.claimedProfile" class="border-dashed p-4 text-center">
  <p class="text-muted-foreground">Is this your company?</p>
  <NuxtLink to="/for-employers" class="text-primary">
    Claim this profile →
  </NuxtLink>
</div>
```

---

## Phase 9: Logo Integration

### 9.1 Update Seed Script

**Update [scripts/seed/seed-contractors.ts](scripts/seed/seed-contractors.ts):**

Set `logoUrl` to `/logos/companies/${slug}.png` for contractors with logos.

### 9.2 Display Logos

**Update [app/pages/contractors/[slug].vue](app/pages/contractors/[slug].vue):**

Display logo in header with fallback to initials.

**Update [app/components/Contractors/ContractorResultItem.vue](app/components/Contractors/ContractorResultItem.vue):**

Show thumbnail logo in browse results.

---

## Key Files Summary

| Purpose | Path |

|---------|------|

| Claimed profiles schema | `server/database/schema/claimed.ts` (new) |

| Employer dashboard | `app/pages/employer/*.vue` (new) |

| Employer components | `app/components/Dashboard/Employer/*.vue` (new) |

| Employer API | `server/api/employer/*.ts` (new) |

| Admin claim review | `app/components/Dashboard/Admin/AdminClaimReview.vue` (new) |

| Admin content review | `app/components/Dashboard/Admin/AdminContentReview.vue` (new) |

| Contractor profile | `app/pages/contractors/[slug].vue` (update) |

| Specialty browse | `app/pages/contractors/specialty/[slug].vue` (new) |

| Location browse | `app/pages/contractors/location/[state].vue` (new) |

| Top contractors | `app/pages/top-defense-contractors.vue` (new) |

| Seed claimed profiles | `scripts/seed/seed-claimed-profiles.ts` (new) |

| Employer landing page | `app/pages/for-employers/index.vue` (new) |

---

## Tier Feature Matrix

| Feature | Free | Claimed ($149) | Premium ($399) |

|---------|------|----------------|----------------|

| Basic profile | Yes | Yes | Yes |

| Edit description, links | No | Yes | Yes |

| Upload logo | No | Yes | Yes |

| Verified badge | No | Yes | Yes |

| Add locations | No | Yes | Yes |

| "Why Work Here" section | No | Yes | Yes |

| Notable programs | No | Yes | Yes |

| Analytics dashboard | No | Yes | Yes |

| Spotlight content | No | No | Yes |

| Employee testimonials | No | No | Yes |

| Priority in search | No | No | Yes |
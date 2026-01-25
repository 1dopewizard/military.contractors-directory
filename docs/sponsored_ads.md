# Sponsored Ads System

This document covers the architecture, algorithms, and recommended improvements for the sponsored ads system.

> **Key Finding:** The embedding-based MOS matching IS being used for contextual ad selection. When a user has a MOS context, `get_random_sponsored_job` filters ads where `p_mos_code = ANY(matched_mos_codes)`, leveraging the vector similarity work done during ad activation.

---

## Fixed-Fee Model

This platform uses a **fixed-fee placement model**, not pay-per-click (PPC). This fundamentally affects how ad selection should work:

| Aspect | PPC Model | Fixed-Fee Model (Ours) |
|--------|-----------|------------------------|
| **Revenue source** | Per-click payment | Flat fee per placement period |
| **CTR optimization** | Maximizes platform revenue | Unfair to advertisers who paid same fee |
| **Fair rotation** | Optional | Essential (this IS what they paid for) |
| **Priority tiers** | Bid-based | Tier-based (Standard vs Premium) |

### Design Principles

1. **Relevance as Filter, Not Rank** — Ads either match the context (MOS, location, clearance) or they don't. No "better match" gets priority.

2. **Fair Rotation** — All ads at the same tier receive equal exposure via inverse-impression weighting.

3. **CTR for Reporting Only** — Click-through rates are tracked for advertiser reporting, not used in selection ranking.

4. **2x Exposure Tiers** — Premium tier pays for 2x the exposure of standard tier (priority used as weight multiplier, not sort order).

## Overview

The sponsored ads system supports two ad types:

| Type | Purpose | Placement |
|------|---------|-----------|
| **Company Spotlight** (`sponsored_ads`) | Brand awareness | Search sidebar |
| **Sponsored Job** (`sponsored_jobs`) | Direct response / job promotion | Search sidebar |

Both types follow the same lifecycle: draft → pending_review → pending_payment → active → expired/cancelled.

---

## Current Architecture

### Data Model

#### `sponsored_ads` (Company Spotlights)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `advertiser` | string | Company name |
| `tagline` | string | Short brand tagline (max 50 chars) |
| `headline` | string | Primary hook (max 80 chars) |
| `description` | string | Value proposition (max 200 chars) |
| `cta_text` | string | Button text (max 25 chars) |
| `cta_url` | string | Destination URL |
| `status` | enum | Ad lifecycle status |
| `starts_at` / `ends_at` | timestamp | Active window |
| `impressions` / `clicks` | int | Performance metrics |
| `priority` | int | Placement tier (1 = standard, 2 = premium) |
| `reviewed_by` / `reviewed_at` | UUID/timestamp | Admin review audit |
| `rejection_reason` | string | If rejected |

#### `sponsored_jobs` (Job Ads)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `title` | string | Job title (max 60 chars) |
| `company` | string | Company name |
| `location` | string | Work location |
| `location_type` | enum | CONUS / OCONUS / Remote / Hybrid |
| `clearance` | string | Required clearance level |
| `sponsor_category` | enum | WILL_SPONSOR / ELIGIBLE_TO_OBTAIN / ACTIVE_ONLY |
| `salary` | string | Compensation range |
| `pitch` | string | Primary selling point (max 120 chars) |
| `apply_url` | string | Application URL |
| `embedding` | vector | OpenAI embedding (1536 dims) |
| `matched_mos_codes` | string[] | Auto-matched MOS codes via embedding similarity |
| `status` | enum | Ad lifecycle status |
| `starts_at` / `ends_at` | timestamp | Active window |
| `impressions` / `clicks` | int | Performance metrics |
| `priority` | int | Placement tier (1 = standard, 2 = premium) |
| `reviewed_by` / `reviewed_at` | UUID/timestamp | Admin review audit |

### Status Lifecycle

```
draft → pending_review → pending_payment → active → expired
                ↓                              ↓
            cancelled                       paused
```

---

## Selection Algorithm

### Current Implementation

The ad selection is handled by two Supabase RPC functions:

#### `get_random_sponsored_ad`

```typescript
// Client usage (useAds.ts)
const { data, error } = await supabase.rpc('get_random_sponsored_ad', {})
const selectedAd = data[0]
```

**Behavior:** Returns a random active sponsored ad. No contextual filtering.

#### `get_random_sponsored_job`

```typescript
// Client usage (useAds.ts)
const { data, error } = await supabase.rpc('get_random_sponsored_job', {
  p_mos_code: context?.mosCode || null,
  p_location_type: context?.locationType || null,
  p_clearance: context?.clearance || null,
})
```

**Parameters:**
- `p_mos_code` — Optional MOS code for contextual matching
- `p_location_type` — Optional location type filter (CONUS/OCONUS/Remote/Hybrid)
- `p_clearance` — Optional clearance level filter

**Behavior:** Attempts contextual match first; if no results, client falls back to random selection (all params null).

### Fallback Logic (Client-Side)

```typescript
// In useAds.ts fetchRandomSponsoredJob()
// 1. Try contextual match
const { data } = await supabase.rpc('get_random_sponsored_job', { p_mos_code, p_location_type, p_clearance })

// 2. If no match and context was provided, fallback to random
if (!data?.length && (mosCode || locationType || clearance)) {
  const { data: fallbackData } = await supabase.rpc('get_random_sponsored_job', {
    p_mos_code: null,
    p_location_type: null,
    p_clearance: null,
  })
}
```

---

## Embedding & MOS Matching

### How It Works

When a sponsored job is activated, the system generates an embedding and matches it to MOS codes:

```
Activation Flow:
1. Admin activates job → activateSponsoredJob()
2. Call /api/ads/generate-embedding with jobId
3. Fetch job data (title, company, pitch, clearance)
4. Generate OpenAI embedding from concatenated text
5. Call match_mos_to_embedding RPC (vector similarity search)
6. Store embedding + matched_mos_codes on the job record
```

### Embedding Generation Endpoint

**POST `/api/ads/generate-embedding`**

```typescript
// server/api/ads/generate-embedding.post.ts
const embeddingText = `${job.title} ${job.company} ${job.pitch} ${job.clearance}`
const embedding = await generateQueryEmbedding(embeddingText)
const { data: mosMatches } = await supabase.rpc('match_mos_to_embedding', {
  query_embedding: formatEmbeddingForPg(embedding),
  match_count: 5,
})
// Stores: { embedding, matched_mos_codes } on sponsored_jobs
```

### MOS Matching RPC

```typescript
match_mos_to_embedding: {
  Args: { query_embedding: string; match_count?: number }
  Returns: { branch: string; code: string; name: string; similarity: number }[]
}
```

Uses pgvector cosine similarity to find the top N MOS codes whose embeddings are most similar to the ad embedding.

---

## Tracking & Analytics

### Impression Tracking

```typescript
// Called when ad is displayed
await supabase.rpc('increment_ad_impressions', { ad_id: adId })
await supabase.rpc('increment_job_impressions', { job_id: jobId })
```

### Click Tracking

```typescript
// Called when user clicks ad
await supabase.rpc('increment_ad_clicks', { ad_id: adId })
await supabase.rpc('increment_job_clicks', { job_id: jobId })
```

**Note:** These metrics are stored but not currently used for selection ranking.

---

## Known Limitations

| Issue | Impact | Status |
|-------|--------|--------|
| ~~Random selection~~ | ~~Active ads get uneven exposure~~ | ✅ Fixed (fair rotation) |
| ~~No priority system~~ | ~~Can't differentiate premium placements~~ | ✅ Fixed (priority tiers) |
| **No impression caps** | One ad could dominate all impressions | Future enhancement |

✅ **Good news:** The `matched_mos_codes` array IS used for contextual matching — embedding work is leveraged.

> **Note on CTR:** Click-through rates are intentionally NOT used for ranking. In a fixed-fee model, penalizing ads with lower CTR would be unfair to advertisers who paid the same placement fee. CTR is tracked for reporting purposes only.

---

## Actual SQL Function Implementations

These are the **actual deployed functions** with fair rotation and priority tiers:

### `get_random_sponsored_ad`

```sql
CREATE OR REPLACE FUNCTION public.get_random_sponsored_ad()
RETURNS SETOF sponsored_ads
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
  SELECT *
  FROM sponsored_ads
  WHERE status = 'active'
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
  ORDER BY 
    -- Priority multiplier: premium (2) gets 2x weight, standard (1) gets 1x
    COALESCE(priority, 1) * (1.0 / GREATEST(impressions, 1)) * random()
  DESC
  LIMIT 1;
$function$;
```

**Behavior:**
- Filters to active ads within valid date range
- **2x exposure** — Premium ads (priority 2) get 2x the selection weight of standard ads (priority 1)
- **Fair rotation** — Ads with fewer impressions get higher selection probability via inverse-impression weighting

### `get_random_sponsored_job`

```sql
CREATE OR REPLACE FUNCTION public.get_random_sponsored_job(
  p_mos_code text DEFAULT NULL,
  p_location_type text DEFAULT NULL,
  p_clearance text DEFAULT NULL
)
RETURNS SETOF sponsored_jobs
LANGUAGE sql
STABLE
AS $function$
  SELECT * FROM sponsored_jobs
  WHERE status = 'active'
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
    -- MOS context matching (if provided)
    AND (p_mos_code IS NULL OR p_mos_code = ANY(matched_mos_codes))
    -- Location type matching (if provided)  
    AND (p_location_type IS NULL OR location_type = p_location_type)
    -- Clearance level matching (if provided)
    AND (p_clearance IS NULL OR clearance = p_clearance)
  ORDER BY 
    -- Priority multiplier: premium (2) gets 2x weight, standard (1) gets 1x
    COALESCE(priority, 1) * (1.0 / GREATEST(impressions, 1)) * random()
  DESC
  LIMIT 1;
$function$;
```

**Behavior:**
- Filters to active ads within valid date range
- ✅ **Uses `matched_mos_codes`** — checks if `p_mos_code` is in the embedding-matched array
- Filters by `location_type` and `clearance` if provided
- **2x exposure** — Premium ads (priority 2) get 2x the selection weight of standard ads (priority 1)
- **Fair rotation** — Ads with fewer impressions get higher selection probability via inverse-impression weighting

### `match_mos_to_embedding`

```sql
CREATE OR REPLACE FUNCTION public.match_mos_to_embedding(
  query_embedding vector,
  match_count integer DEFAULT 5
)
RETURNS TABLE(code text, name text, branch text, similarity double precision)
LANGUAGE sql
STABLE
AS $function$
  SELECT 
    code,
    name,
    branch,
    1 - (embedding <=> query_embedding) as similarity
  FROM mos_codes
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$function$;
```

**Behavior:** Cosine similarity search using pgvector. Returns top N MOS codes most similar to the query embedding.

### Tracking Functions

```sql
-- increment_ad_impressions
CREATE OR REPLACE FUNCTION public.increment_ad_impressions(ad_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $function$
  UPDATE sponsored_ads 
  SET impressions = impressions + 1, updated_at = now() 
  WHERE id = ad_id;
$function$;

-- increment_ad_clicks
CREATE OR REPLACE FUNCTION public.increment_ad_clicks(ad_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $function$
  UPDATE sponsored_ads 
  SET clicks = clicks + 1, updated_at = now() 
  WHERE id = ad_id;
$function$;

-- increment_job_impressions
CREATE OR REPLACE FUNCTION public.increment_job_impressions(job_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $function$
  UPDATE sponsored_jobs 
  SET impressions = impressions + 1, updated_at = now() 
  WHERE id = job_id;
$function$;

-- increment_job_clicks
CREATE OR REPLACE FUNCTION public.increment_job_clicks(job_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $function$
  UPDATE sponsored_jobs 
  SET clicks = clicks + 1, updated_at = now() 
  WHERE id = job_id;
$function$;
```

---

## Future Improvements

### 1. Impression Caps (Soft)

**Problem:** One ad can consume all available impressions in low-inventory situations.

**Solution:** Add soft daily impression caps that reduce priority but don't exclude ads when no alternatives exist.

```sql
-- Schema change
ALTER TABLE sponsored_jobs ADD COLUMN daily_impression_cap INT;
ALTER TABLE sponsored_jobs ADD COLUMN impressions_today INT DEFAULT 0;

-- Soft cap in ORDER BY (0.1x weight if over cap)
ORDER BY 
  CASE 
    WHEN daily_impression_cap IS NOT NULL 
         AND impressions_today >= daily_impression_cap 
    THEN 0.1 
    ELSE 1.0 
  END
  * COALESCE(priority, 1)
  * (1.0 / GREATEST(impressions, 1)) * random()
DESC

-- Reset daily via cron/scheduled function
```

### 2. Semantic Relevance Scoring

**Problem:** MOS matching is binary (in array or not).

**Solution:** Use embedding similarity for ranking when user has MOS context.

```sql
CREATE OR REPLACE FUNCTION get_relevant_sponsored_job(
  p_user_mos_embedding vector(1536),
  p_location_type TEXT DEFAULT NULL,
  p_clearance TEXT DEFAULT NULL
)
RETURNS SETOF sponsored_jobs
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM sponsored_jobs
  WHERE status = 'active'
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at > NOW())
    AND embedding IS NOT NULL
    AND (p_location_type IS NULL OR location_type = p_location_type)
    AND (p_clearance IS NULL OR clearance = p_clearance)
  ORDER BY 
    -- Cosine similarity between user MOS embedding and job embedding
    1 - (embedding <=> p_user_mos_embedding)
  DESC
  LIMIT 1;
$$;
```

This requires passing the user's MOS embedding from the client, which is a larger architectural change.

---

## Implementation Roadmap

### Phase 1: Foundation ✅ Complete

1. [x] Verify `get_random_sponsored_job` uses `matched_mos_codes`
2. [x] Add `priority` column for premium tiers
3. [x] Implement fair rotation (inverse impression weighting)
4. [x] Update both `get_random_sponsored_ad` and `get_random_sponsored_job`

### Phase 2: Future Enhancements

5. [ ] Add soft daily impression caps
6. [ ] Implement semantic relevance scoring (use embeddings directly)
7. [ ] Add A/B testing framework for ad variations
8. [ ] Build analytics dashboard for advertisers

---

## File Reference

| File | Purpose |
|------|---------|
| `app/composables/useAds.ts` | Client-side ad fetching, tracking, CRUD |
| `app/types/ad.types.ts` | TypeScript types for ads |
| `app/types/database.types.ts` | Generated Supabase types (RPC signatures) |
| `server/api/ads/generate-embedding.post.ts` | Embedding generation endpoint |

---

## Related Documentation

- [Refactoring UI Guidelines](./ui/refactoring-ui-guidelines.md) — Ad component styling
- [Database Schema](./database-schema.md) — Table definitions including `sponsored_ads` and `sponsored_jobs`

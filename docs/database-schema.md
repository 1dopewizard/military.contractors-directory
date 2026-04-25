# Database Schema

The active product schema supports contractor directory profiles, claimed profile management, auth, admin activity, and source-backed contractor intelligence.

## Intelligence Tables

| Table | Purpose |
| --- | --- |
| `recipientEntity` | Normalized USAspending recipients linked to local contractor profiles when known |
| `agency` | Awarding and funding agency references encountered during normalization |
| `naicsCode` | NAICS codes and titles encountered in award records |
| `pscCode` | PSC codes and titles encountered in award records |
| `award` | Normalized USAspending award rows cached from public API responses |
| `awardTransaction` | Reserved transaction-level cache table |
| `explorerQueryCache` | Persistent cache for explorer, profile, ranking, and page responses |

## Cache Policy

Public reads prefer cached data. Refreshes use USAspending when entries are stale; if USAspending fails and a cache entry exists, stale data can be served with a freshness warning. Admin tools can force refresh immediately from `/admin?tab=intelligence`.

## Directory Tables

Contractor browsing remains backed by:

| Table | Purpose |
| --- | --- |
| `contractor` | Company profiles, revenue context, headquarters, and public links |
| `specialty` | Contractor category taxonomy |
| `contractorSpecialty` | Contractor-to-specialty mappings |
| `contractorLocation` | Office and headquarters locations |

Claimed profile tables remain available for company-managed context and admin review.

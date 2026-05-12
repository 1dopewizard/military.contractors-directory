---
title: Contractor Intelligence Signals
status: draft
date: 2026-05-10
---

# Contractor Intelligence Signals

Contractor signals are source-linked indicators that help readers interpret public award activity. They are not A-F grades, performance ratings, responsibility determinations, or endorsements.

## Signal contract

Each public signal should include:

- `key` and `label`
- descriptive `status` such as `healthy`, `watch`, `concentrated`, `growing`, `declining`, `fresh`, or `unavailable`
- human-readable `value`
- plain-English explanation
- calculation window
- source fields and source links
- confidence and caveats

Unavailable signals must render as neutral data-coverage states instead of fabricated interpretations.

## Initial signals

### Competition exposure

- **Inputs:** award type fields from sampled award records.
- **Interpretation:** estimates how much visible activity appears in competitive contract award-type categories.
- **Limitations:** public award type is only a rough proxy; it does not fully describe solicitation history, set-asides, sole-source justification, or task-order competition.
- **Status rule:** `healthy` when at least half of award records with award type metadata look competitive, otherwise `watch`; `unavailable` when award type data is absent.

### Agency concentration

- **Inputs:** awarding agency bucket obligations and total profile obligations.
- **Interpretation:** shows whether observed obligations are concentrated in one agency.
- **Status rule:** `concentrated` at 70% or more, `watch` at 45-69%, `healthy` below 45%.
- **Limitations:** concentration can be normal for specialized contractors and is not a negative judgment.

### NAICS concentration

- **Inputs:** NAICS bucket obligations and total profile obligations.
- **Interpretation:** shows whether observed activity is concentrated in one industry classification.
- **Status rule:** `concentrated` at 70% or more, `watch` at 45-69%, `healthy` below 45%; `unavailable` when NAICS metadata is missing.
- **Limitations:** NAICS coding can be broad, inconsistent, or missing from public data.

### PSC concentration

- **Inputs:** PSC bucket obligations and total profile obligations.
- **Interpretation:** shows whether observed activity is concentrated in one product/service class.
- **Status rule:** `concentrated` at 70% or more, `watch` at 45-69%, `healthy` below 45%; `unavailable` when PSC metadata is missing.
- **Limitations:** PSC values can be broad and do not capture all capability context.

### Award trend

- **Inputs:** fiscal-year obligations from the profile trend.
- **Interpretation:** compares the latest fiscal year with the previous fiscal year.
- **Status rule:** `growing` above +10%, `declining` below -10%, otherwise `stable`; `unavailable` with fewer than two yearly points.
- **Limitations:** recent public data can lag while awards and modifications are posted.

### Source freshness

- **Inputs:** source metadata cache status, refreshed timestamp, warnings, and structured record count.
- **Interpretation:** tells readers whether signal data is live/fresh, cached, stale, or degraded.
- **Status rule:** `fresh` for live/cached data, `stale` for stale/error cache states.
- **Limitations:** freshness describes local cache state and public-data retrieval, not data accuracy by itself.

## Provenance rules

- Public signals use USAspending-backed award data and local cache metadata.
- Contractor-submitted profile context must be displayed separately from public source-backed signals.
- Corrections can add review context but must not silently overwrite public source facts.
- Paid products must never sell factual corrections, score improvement, or ranking boosts.

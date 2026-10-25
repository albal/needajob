# Searches are answered from a harvested Job Pool, not live Adzuna calls

The PRD had the Worker proxy each Search to Adzuna live. Adzuna's free tier allows 250 calls a day and 2,500 a month, on a key shared with jobscout, and with multi-Discipline Searches across all 19 Countries and every Location the combinations are far too many to cache, so live proxying would exhaust the quota almost immediately. Instead a scheduled Worker harvests each Country's newest tech Entry-Level Jobs a few times a day (`category=it-jobs`, `what_or` of single-word Entry-Level Markers, `sort_by=date`), applies our title rules, and stores the result as that Country's Job Pool. Searches filter the Job Pool locally by Discipline and Location and paginate over it, costing no Adzuna calls.

## Consequences

- Results can be up to 12 hours stale, and a high-volume Country may be only partially harvested.
- Location options are derived from the Job Pool itself, so no geodata calls are needed.
- Adzuna's `what` has no boolean OR, so the PRD's `"Junior SRE" OR ...` query construction is not used; precision comes from our own title filtering.
- Each Country's Job Pool is stored as a single compact Workers KV value, keeping Harvest writes far inside KV's free-tier limit; D1 stays reserved for post-MVP accounts. If a large Country's Pool pushes Search past the free-tier CPU limit, split it by region rather than moving to D1.
- A failed Harvest leaves the previous Job Pool in place, and the UI shows when Jobs were last updated.
- The cron runs hourly and Harvests one twelfth of the Countries each run, so every Country is Harvested every 12 hours (gb and us 2 pages, the rest 1). That is about 42 Adzuna calls a day, leaving room in the shared 2,500-a-month quota for jobscout, and no single run approaches the free plan's 10ms CPU or 50-subrequest limits.

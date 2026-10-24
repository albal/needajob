import type { DisciplineSlug, Job, JobPool, JobsResponse, LocationOption } from "./types";

export const PAGE_SIZE = 20;

export interface SearchQuery {
  country: string;
  page: number;
  /** Any-of; empty means all Disciplines. */
  disciplines: DisciplineSlug[];
  /** A region includes all of its counties. */
  region?: string;
  county?: string;
}

/** The regions, and counties within them, that have at least one Job. */
export function locationOptions(jobs: Job[]): LocationOption[] {
  const regions = new Map<string, Set<string>>();
  for (const { region, county } of jobs) {
    if (!region) continue;
    const counties = regions.get(region) ?? new Set();
    if (county) counties.add(county);
    regions.set(region, counties);
  }
  return [...regions]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([region, counties]) => ({ region, counties: [...counties].sort((a, b) => a.localeCompare(b)) }));
}

/** Answers a Search from a Country's Job Pool (or its absence). */
export function search(pool: JobPool | null, query: SearchQuery): JobsResponse {
  const wanted = new Set(query.disciplines);
  const all = pool?.jobs ?? [];
  const jobs = all
    .filter((j) => !query.region || j.region === query.region)
    .filter((j) => !query.county || j.county === query.county)
    .filter((j) => wanted.size === 0 || j.disciplines.some((d) => wanted.has(d)))
    .sort((a, b) => b.created.localeCompare(a.created));
  const start = (query.page - 1) * PAGE_SIZE;
  return {
    country: query.country,
    page: query.page,
    pageSize: PAGE_SIZE,
    total: jobs.length,
    jobs: jobs.slice(start, start + PAGE_SIZE),
    locations: locationOptions(all),
    updatedAt: pool?.updatedAt ?? null,
  };
}

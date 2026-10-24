import type { JobPool, JobsResponse } from "./types";

export const PAGE_SIZE = 20;

export interface SearchQuery {
  country: string;
  page: number;
}

/** Answers a Search from a Country's Job Pool (or its absence). */
export function search(pool: JobPool | null, query: SearchQuery): JobsResponse {
  const jobs = [...(pool?.jobs ?? [])].sort((a, b) => b.created.localeCompare(a.created));
  const start = (query.page - 1) * PAGE_SIZE;
  return {
    country: query.country,
    page: query.page,
    pageSize: PAGE_SIZE,
    total: jobs.length,
    jobs: jobs.slice(start, start + PAGE_SIZE),
    locations: [],
    updatedAt: pool?.updatedAt ?? null,
  };
}

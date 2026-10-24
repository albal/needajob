import type { JobsResponse } from "../core/types";

export async function fetchJobs(params: URLSearchParams): Promise<JobsResponse> {
  const query = params.toString();
  const res = await fetch(query ? `/api/jobs?${query}` : "/api/jobs");
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  return res.json();
}

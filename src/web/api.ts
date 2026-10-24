import type { JobsResponse } from "../core/types";

export async function fetchJobs(params: URLSearchParams): Promise<JobsResponse> {
  const res = await fetch(`/api/jobs?${params}`);
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  return res.json();
}

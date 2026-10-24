import { vi } from "vitest";
import type { Job, JobsResponse } from "../core/types";

export function emptyResponse(overrides: Partial<JobsResponse> = {}): JobsResponse {
  return {
    country: "gb",
    page: 1,
    pageSize: 20,
    total: 0,
    jobs: [],
    locations: [],
    updatedAt: null,
    ...overrides,
  };
}

/** Stubs `/api/jobs`, answering each request via `respond`. */
export function stubApi(respond: (url: URL) => JobsResponse) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = new URL(String(input), "http://localhost");
    return new Response(JSON.stringify(respond(url)), {
      headers: { "content-type": "application/json" },
    });
  });
}

let nextId = 1;

export function job(overrides: Partial<Job> = {}): Job {
  const id = overrides.id ?? `job-${nextId++}`;
  return {
    id,
    title: "Junior Software Engineer",
    company: "Acme Ltd",
    locationName: "Winchester, Hampshire",
    region: "South East England",
    county: "Hampshire",
    description: "Join our team.",
    created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    redirectUrl: `https://www.adzuna.co.uk/jobs/land/ad/${id}`,
    disciplines: ["software"],
    ...overrides,
  };
}

/** A stub that serves `jobs` 20 per page according to the `page` param. */
export function pagedResponder(jobs: Job[]) {
  return (url: URL): JobsResponse => {
    const page = Number(url.searchParams.get("page") ?? "1");
    return emptyResponse({
      page,
      total: jobs.length,
      jobs: jobs.slice((page - 1) * 20, page * 20),
      updatedAt: new Date().toISOString(),
    });
  };
}

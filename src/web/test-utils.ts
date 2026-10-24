import { vi } from "vitest";
import type { JobsResponse } from "../core/types";

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

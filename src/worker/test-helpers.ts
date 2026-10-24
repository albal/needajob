import { env, exports } from "cloudflare:workers";
import { createExecutionContext, createScheduledController, waitOnExecutionContext } from "cloudflare:test";
import { vi } from "vitest";
import type { JobsResponse } from "../core/types";
import type { AdzunaResult } from "./adzuna";
import worker from "./index";

let nextId = 1;

export function adzunaResult(overrides: Partial<AdzunaResult> = {}): AdzunaResult {
  const id = overrides.id ?? String(nextId++);
  return {
    id,
    title: "Junior Software Engineer",
    description: "Join our team as a <strong>junior</strong> engineer.",
    created: "2026-10-20T09:00:00Z",
    redirect_url: `https://www.adzuna.co.uk/jobs/land/ad/${id}?v=abc`,
    company: { display_name: "Acme Ltd" },
    location: { display_name: "Winchester, Hampshire", area: ["UK", "South East England", "Hampshire", "Winchester"] },
    ...overrides,
  };
}

type Responder = (country: string, page: number, url: URL) => AdzunaResult[] | Response;

/** Stubs outbound calls to Adzuna; returns the URLs that were requested. */
export function stubAdzuna(respond: Responder): URL[] {
  const calls: URL[] = [];
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.hostname !== "api.adzuna.com") throw new Error(`Unexpected fetch to ${url}`);
    calls.push(url);
    const [, country, , page] = url.pathname.match(/\/jobs\/(\w+)\/(search)\/(\d+)/) ?? [];
    const out = respond(country!, Number(page), url);
    return out instanceof Response ? out : Response.json({ count: out.length, results: out });
  });
  return calls;
}

/** Runs the hourly cron; by default at an hour when gb is due. */
export async function runHarvest(now = new Date("2026-10-21T00:00:00Z")): Promise<void> {
  const ctx = createExecutionContext();
  await worker.scheduled(createScheduledController({ cron: "0 * * * *", scheduledTime: now.getTime() }), env, ctx);
  await waitOnExecutionContext(ctx);
}

export async function getJobs(query = "", visitorCountry?: string): Promise<{ status: number; body: JobsResponse }> {
  const res = await exports.default.fetch(`https://needajob.test/api/jobs${query}`, {
    cf: visitorCountry ? { country: visitorCountry } : undefined,
  });
  return { status: res.status, body: await res.json() };
}

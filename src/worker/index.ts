import { Hono } from "hono";
import { findCountry } from "../core/countries";
import { search } from "../core/search";
import type { DisciplineSlug } from "../core/types";
import { DISCIPLINES } from "../core/word-lists";
import { harvest } from "./harvest";
import { readPool } from "./pool-store";

const app = new Hono<{ Bindings: Env }>();

const isDiscipline = (s: string): s is DisciplineSlug => DISCIPLINES.some((d) => d.slug === s);

/** The visitor's Country as detected by Cloudflare, if Adzuna covers it; otherwise gb. */
function defaultCountry(request: Request): string {
  const detected = String(request.cf?.country ?? "").toLowerCase();
  // Adzuna, like most of the web, calls the UK "gb".
  return findCountry(detected)?.code ?? "gb";
}

app.get("/api/jobs", async (c) => {
  const countryParam = c.req.query("country");
  if (countryParam !== undefined && !findCountry(countryParam)) {
    return c.json({ error: `Unsupported country: ${countryParam}` }, 400);
  }
  const country = countryParam ?? defaultCountry(c.req.raw);

  const pageParam = c.req.query("page") ?? "1";
  const page = Number(pageParam);
  if (!/^\d+$/.test(pageParam) || page < 1) {
    return c.json({ error: "page must be a positive integer" }, 400);
  }

  const disciplines = c.req.queries("discipline") ?? [];
  const unknown = disciplines.filter((d) => !isDiscipline(d));
  if (unknown.length > 0) {
    return c.json({ error: `Unknown discipline: ${unknown.join(", ")}` }, 400);
  }

  const region = c.req.query("region") || undefined;
  const county = c.req.query("county") || undefined;
  if (county && !region) {
    return c.json({ error: "county requires region" }, 400);
  }

  const pool = await readPool(c.env.JOB_POOLS, country);
  return c.json(search(pool, { country, page, disciplines: disciplines as DisciplineSlug[], region, county }));
});

export default {
  fetch: app.fetch,
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(harvest(env, new Date(controller.scheduledTime)));
  },
} satisfies ExportedHandler<Env>;

import { Hono } from "hono";
import { search } from "../core/search";
import type { DisciplineSlug } from "../core/types";
import { DISCIPLINES } from "../core/word-lists";
import { harvest } from "./harvest";
import { readPool } from "./pool-store";

const app = new Hono<{ Bindings: Env }>();

const isDiscipline = (s: string): s is DisciplineSlug => DISCIPLINES.some((d) => d.slug === s);

app.get("/api/jobs", async (c) => {
  const country = "gb";

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

  const pool = await readPool(c.env.JOB_POOLS, country);
  return c.json(search(pool, { country, page, disciplines: disciplines as DisciplineSlug[] }));
});

export default {
  fetch: app.fetch,
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(harvest(env));
  },
} satisfies ExportedHandler<Env>;

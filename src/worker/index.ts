import { Hono } from "hono";
import { search } from "../core/search";
import { harvest } from "./harvest";
import { readPool } from "./pool-store";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/jobs", async (c) => {
  const country = "gb";
  const pageParam = c.req.query("page") ?? "1";
  const page = Number(pageParam);
  if (!/^\d+$/.test(pageParam) || page < 1) {
    return c.json({ error: "page must be a positive integer" }, 400);
  }
  const pool = await readPool(c.env.JOB_POOLS, country);
  return c.json(search(pool, { country, page }));
});

export default {
  fetch: app.fetch,
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(harvest(env));
  },
} satisfies ExportedHandler<Env>;

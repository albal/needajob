import { Hono } from "hono";
import { search } from "../core/search";
import { readPool } from "./pool-store";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/jobs", async (c) => {
  const country = "gb";
  const pool = await readPool(c.env.JOB_POOLS, country);
  return c.json(search(pool, { country, page: 1 }));
});

export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Env>;

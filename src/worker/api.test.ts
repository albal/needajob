import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("GET /api/jobs", () => {
  it("returns an empty result when the Country has never been Harvested", async () => {
    const res = await exports.default.fetch("https://needajob.test/api/jobs");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      country: "gb",
      page: 1,
      pageSize: 20,
      total: 0,
      jobs: [],
      locations: [],
      updatedAt: null,
    });
  });
});

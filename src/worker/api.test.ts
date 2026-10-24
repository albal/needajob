import { describe, expect, it } from "vitest";
import { adzunaResult, getJobs, runHarvest, stubAdzuna } from "./test-helpers";

describe("GET /api/jobs", () => {
  it("returns an empty result when the Country has never been Harvested", async () => {
    const { status, body } = await getJobs();
    expect(status).toBe(200);
    expect(body).toEqual({
      country: "gb",
      page: 1,
      pageSize: 20,
      total: 0,
      jobs: [],
      locations: [],
      updatedAt: null,
    });
  });

  it("returns Jobs newest first, 20 per page, with a total", async () => {
    const day = (n: number) => `2026-10-${String(n).padStart(2, "0")}T09:00:00Z`;
    stubAdzuna(() => Array.from({ length: 25 }, (_, i) => adzunaResult({ id: `job-${i + 1}`, created: day(i + 1) })));
    await runHarvest();

    const first = await getJobs();
    expect(first.body.total).toBe(25);
    expect(first.body.jobs).toHaveLength(20);
    expect(first.body.jobs[0]!.id).toBe("job-25");

    const second = await getJobs("?page=2");
    expect(second.body.page).toBe(2);
    expect(second.body.jobs.map((j) => j.id)).toEqual(["job-5", "job-4", "job-3", "job-2", "job-1"]);
  });

  it.each(["0", "-1", "abc", "1.5"])("rejects page=%s", async (page) => {
    expect((await getJobs(`?page=${page}`)).status).toBe(400);
  });

  it("filters by any of several Disciplines", async () => {
    stubAdzuna(() => [
      adzunaResult({ id: "devops", title: "Junior DevOps Engineer" }),
      adzunaResult({ id: "sre", title: "Graduate SRE" }),
      adzunaResult({ id: "frontend", title: "Junior Frontend Engineer" }),
    ]);
    await runHarvest();

    const { body } = await getJobs("?discipline=devops&discipline=sre");
    expect(body.jobs.map((j) => j.id).sort()).toEqual(["devops", "sre"]);
    expect(body.total).toBe(2);
  });

  it("rejects an unknown Discipline", async () => {
    expect((await getJobs("?discipline=devops&discipline=wizard")).status).toBe(400);
  });
});

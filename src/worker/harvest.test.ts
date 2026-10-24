import { afterEach, describe, expect, it, vi } from "vitest";
import { adzunaResult, getJobs, runHarvest, stubAdzuna } from "./test-helpers";

afterEach(() => vi.restoreAllMocks());

describe("Harvest", () => {
  it("asks Adzuna for gb's newest IT Entry-Level Jobs, three pages of 50", async () => {
    const full = () => Array.from({ length: 50 }, () => adzunaResult());
    const calls = stubAdzuna(() => full());

    await runHarvest();

    expect(calls.map((u) => u.pathname)).toEqual([
      "/v1/api/jobs/gb/search/1",
      "/v1/api/jobs/gb/search/2",
      "/v1/api/jobs/gb/search/3",
    ]);
    const params = calls[0]!.searchParams;
    expect(params.get("app_id")).toBe("test-id");
    expect(params.get("app_key")).toBe("test-key");
    expect(params.get("category")).toBe("it-jobs");
    expect(params.get("sort_by")).toBe("date");
    expect(params.get("results_per_page")).toBe("50");
    expect(params.get("what_or")?.split(" ")).toEqual(expect.arrayContaining(["junior", "graduate", "intern"]));
  });

  it("stops early when Adzuna runs out of results", async () => {
    const calls = stubAdzuna(() => [adzunaResult()]);
    await runHarvest();
    expect(calls).toHaveLength(1);
  });

  it("keeps only Entry-Level Jobs that match a Discipline, tagged with their Disciplines", async () => {
    stubAdzuna(() => [
      adzunaResult({ id: "keep", title: "Junior <strong>DevOps</strong> Engineer" }),
      adzunaResult({ id: "senior", title: "Senior Software Engineer" }),
      adzunaResult({ id: "mentor", title: "Senior Engineer - Graduate Scheme Mentor" }),
      adzunaResult({ id: "no-discipline", title: "Junior Data Analyst" }),
    ]);

    await runHarvest();
    const { body } = await getJobs();

    expect(body.jobs.map((j) => [j.id, j.title, j.disciplines])).toEqual([["keep", "Junior DevOps Engineer", ["devops"]]]);
    expect(body.updatedAt).not.toBeNull();
  });

  it("keeps Stated Salaries and drops predicted ones", async () => {
    stubAdzuna(() => [
      adzunaResult({ id: "stated", salary_min: 28000, salary_max: 32000, salary_is_predicted: "0" }),
      adzunaResult({ id: "predicted", salary_min: 40000, salary_max: 40000, salary_is_predicted: "1" }),
      adzunaResult({ id: "predicted-number", salary_min: 41000, salary_is_predicted: 1 }),
    ]);

    await runHarvest();
    const { body } = await getJobs();
    const byId = Object.fromEntries(body.jobs.map((j) => [j.id, j]));

    expect(byId.stated).toMatchObject({ salaryMin: 28000, salaryMax: 32000 });
    expect(byId.predicted!.salaryMin).toBeUndefined();
    expect(byId["predicted-number"]!.salaryMin).toBeUndefined();
  });

  it("stores card fields with a trimmed plain-text description", async () => {
    stubAdzuna(() => [adzunaResult({ id: "1", description: `<strong>Junior</strong> role &amp; ${"word ".repeat(80)}` })]);

    await runHarvest();
    const job = (await getJobs()).body.jobs[0]!;

    expect(job).toMatchObject({
      company: "Acme Ltd",
      locationName: "Winchester, Hampshire",
      region: "South East England",
      county: "Hampshire",
      redirectUrl: "https://www.adzuna.co.uk/jobs/land/ad/1?v=abc",
    });
    expect(job.description.startsWith("Junior role & word")).toBe(true);
    expect(job.description.length).toBeLessThanOrEqual(201);
    expect(job.description.endsWith("…")).toBe(true);
  });
});

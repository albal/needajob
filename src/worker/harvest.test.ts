import { describe, expect, it } from "vitest";
import { adzunaResult, getJobs, runHarvest, stubAdzuna } from "./test-helpers";

describe("Harvest", () => {
  it("asks Adzuna for gb's newest IT Entry-Level Jobs, two pages of 50", async () => {
    const full = () => Array.from({ length: 50 }, () => adzunaResult());
    const calls = stubAdzuna(() => full());

    await runHarvest();

    expect(calls.map((u) => u.pathname).filter((p) => p.includes("/gb/"))).toEqual([
      "/v1/api/jobs/gb/search/1",
      "/v1/api/jobs/gb/search/2",
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
    expect(calls.filter((u) => u.pathname.includes("/gb/"))).toHaveLength(1);
  });

  it("Harvests every Country once every 12 hours, a few per hourly run", async () => {
    const calls = stubAdzuna(() => Array.from({ length: 50 }, () => adzunaResult()));
    const perRun: number[] = [];
    for (let hour = 0; hour < 12; hour++) {
      const before = calls.length;
      await runHarvest(new Date(Date.UTC(2026, 9, 21, hour)));
      perRun.push(calls.length - before);
    }

    const countries = calls.map((u) => u.pathname.split("/")[4]);
    expect(new Set(countries).size).toBe(19);
    // gb and us get 2 pages, the other 17 Countries 1: 21 calls in 12 hours.
    expect(calls).toHaveLength(21);
    expect(Math.max(...perRun)).toBeLessThanOrEqual(3);
    expect(countries.filter((c) => c === "us")).toHaveLength(2);
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

  it("asks Adzuna for local-language Entry-Level Markers too", async () => {
    const calls = stubAdzuna(() => []);
    // 08:00 UTC is when de's group is due; 04:00 is be's.
    await runHarvest(new Date("2026-10-21T08:00:00Z"));
    await runHarvest(new Date("2026-10-21T04:00:00Z"));

    const whatOr = (country: string) =>
      calls.find((u) => u.pathname.includes(`/${country}/`))!.searchParams.get("what_or")!.split(" ");
    expect(whatOr("de")).toEqual(expect.arrayContaining(["junior", "werkstudent", "praktikum"]));
    expect(whatOr("be")).toEqual(expect.arrayContaining(["junior", "stagiair", "stagiaire"]));
    expect(new Set(whatOr("be")).size).toBe(whatOr("be").length);
  });

  it("keeps local-language Entry-Level Jobs", async () => {
    stubAdzuna((country) =>
      country === "de" ? [adzunaResult({ id: "ws", title: "Werkstudent DevOps (m/w/d)" })] : [],
    );
    await runHarvest(new Date("2026-10-21T08:00:00Z"));
    expect((await getJobs("?country=de")).body.jobs.map((j) => [j.id, j.disciplines])).toEqual([["ws", ["devops"]]]);
  });
});

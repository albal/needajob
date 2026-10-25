import { describe, expect, it, vi } from "vitest";
import { adzunaResult, getJobs, runHarvest, stubAdzuna } from "./test-helpers";

const at = (iso: string) => new Date(iso);

describe("Harvest merging", () => {
  it("adds new Jobs to the Job Pool instead of replacing it", async () => {
    stubAdzuna(() => [adzunaResult({ id: "a", created: "2026-10-20T00:00:00Z" })]);
    await runHarvest(at("2026-10-21T00:00:00Z"));

    vi.restoreAllMocks();
    stubAdzuna(() => [adzunaResult({ id: "b", created: "2026-10-21T00:00:00Z" })]);
    await runHarvest(at("2026-10-21T12:00:00Z"));

    expect((await getJobs()).body.jobs.map((j) => j.id)).toEqual(["b", "a"]);
  });

  it("lets newer data for the same Job win", async () => {
    stubAdzuna(() => [adzunaResult({ id: "a", company: { display_name: "Old Name" } })]);
    await runHarvest(at("2026-10-21T00:00:00Z"));

    vi.restoreAllMocks();
    stubAdzuna(() => [adzunaResult({ id: "a", company: { display_name: "New Name" } })]);
    await runHarvest(at("2026-10-21T12:00:00Z"));

    const { body } = await getJobs();
    expect(body.total).toBe(1);
    expect(body.jobs[0]!.company).toBe("New Name");
  });

  it("drops Jobs more than 30 days old", async () => {
    stubAdzuna(() => [
      adzunaResult({ id: "fresh", created: "2026-10-01T00:00:00Z" }),
      adzunaResult({ id: "stale", created: "2026-09-20T00:00:00Z" }),
    ]);
    await runHarvest(at("2026-10-01T12:00:00Z"));
    expect((await getJobs()).body.total).toBe(2);

    vi.restoreAllMocks();
    stubAdzuna(() => []);
    await runHarvest(at("2026-10-24T00:00:00Z"));
    expect((await getJobs()).body.jobs.map((j) => j.id)).toEqual(["fresh"]);
  });

  it("records when the Job Pool was last updated", async () => {
    stubAdzuna(() => [adzunaResult()]);
    await runHarvest(at("2026-10-21T12:00:00Z"));
    expect((await getJobs()).body.updatedAt).toBe("2026-10-21T12:00:00.000Z");
  });
});

describe("Harvest failures", () => {
  it.each([
    ["an error status", () => new Response("rate limited", { status: 429 })],
    ["a network error", () => { throw new TypeError("network down"); }],
  ])("keep the existing Job Pool on %s", async (_, fail) => {
    stubAdzuna(() => [adzunaResult({ id: "a" })]);
    await runHarvest(at("2026-10-21T00:00:00Z"));

    vi.restoreAllMocks();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    // The first page succeeds and a later one fails: nothing partial is written.
    stubAdzuna((_country, page) => (page === 1 ? Array.from({ length: 50 }, () => adzunaResult()) : fail()));
    await runHarvest(at("2026-10-21T12:00:00Z"));

    const { body } = await getJobs();
    expect(body.jobs.map((j) => j.id)).toEqual(["a"]);
    expect(body.updatedAt).toBe("2026-10-21T00:00:00.000Z");
    expect(error).toHaveBeenCalled();
  });
});

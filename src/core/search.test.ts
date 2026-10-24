import { describe, expect, it } from "vitest";
import { search } from "./search";
import type { Job, JobPool } from "./types";

describe("search", () => {
  it("returns no Jobs and no updatedAt when there is no Job Pool", () => {
    const result = search(null, { country: "gb", page: 1, disciplines: [] });
    expect(result.total).toBe(0);
    expect(result.jobs).toEqual([]);
    expect(result.updatedAt).toBeNull();
  });
});

const job = (id: string, disciplines: Job["disciplines"], place: Partial<Job> = {}): Job => ({
  id,
  title: id,
  description: "",
  created: "2026-10-20T00:00:00Z",
  redirectUrl: "",
  disciplines,
  ...place,
});

const pool: JobPool = {
  country: "gb",
  updatedAt: "2026-10-21T00:00:00Z",
  jobs: [job("devops", ["devops"]), job("sre", ["sre"]), job("both", ["devops", "platform"]), job("fe", ["frontend"])],
};

describe("search by Discipline", () => {
  const ids = (disciplines: Job["disciplines"]) =>
    search(pool, { country: "gb", page: 1, disciplines }).jobs.map((j) => j.id).sort();

  it("returns every Job when no Discipline is chosen", () => {
    expect(ids([])).toEqual(["both", "devops", "fe", "sre"]);
  });

  it("returns Jobs matching any chosen Discipline", () => {
    expect(ids(["devops", "sre"])).toEqual(["both", "devops", "sre"]);
    expect(ids(["platform"])).toEqual(["both"]);
  });

  it("counts only matching Jobs in the total", () => {
    expect(search(pool, { country: "gb", page: 1, disciplines: ["sre"] }).total).toBe(1);
  });
});

describe("search by Location", () => {
  const hants = { region: "South East England", county: "Hampshire" };
  const surrey = { region: "South East England", county: "Surrey" };
  const london = { region: "London", county: "Central London" };
  const placed: JobPool = {
    country: "gb",
    updatedAt: "2026-10-21T00:00:00Z",
    jobs: [job("h", ["devops"], hants), job("s", ["sre"], surrey), job("l", ["devops"], london), job("nowhere", ["devops"])],
  };
  const ids = (q: { region?: string; county?: string; disciplines?: Job["disciplines"] }) =>
    search(placed, { country: "gb", page: 1, disciplines: [], ...q }).jobs.map((j) => j.id).sort();

  it("searches the whole Country when no Location is given", () => {
    expect(ids({})).toEqual(["h", "l", "nowhere", "s"]);
  });

  it("includes every county in a region", () => {
    expect(ids({ region: "South East England" })).toEqual(["h", "s"]);
  });

  it("narrows to a county", () => {
    expect(ids({ region: "South East England", county: "Hampshire" })).toEqual(["h"]);
  });

  it("combines Location with Disciplines", () => {
    expect(ids({ region: "South East England", disciplines: ["sre"] })).toEqual(["s"]);
  });

  it("offers only places that have Jobs, sorted, regardless of the current filters", () => {
    expect(search(placed, { country: "gb", page: 1, disciplines: ["sre"], region: "London" }).locations).toEqual([
      { region: "London", counties: ["Central London"] },
      { region: "South East England", counties: ["Hampshire", "Surrey"] },
    ]);
  });
});

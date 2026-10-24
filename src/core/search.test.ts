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

const job = (id: string, disciplines: Job["disciplines"]): Job => ({
  id,
  title: id,
  description: "",
  created: "2026-10-20T00:00:00Z",
  redirectUrl: "",
  disciplines,
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

import { describe, expect, it } from "vitest";
import { search } from "./search";

describe("search", () => {
  it("returns no Jobs and no updatedAt when there is no Job Pool", () => {
    const result = search(null, { country: "gb", page: 1 });
    expect(result.total).toBe(0);
    expect(result.jobs).toEqual([]);
    expect(result.updatedAt).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { classifyTitle } from "./classify";

describe("classifyTitle (English)", () => {
  it.each([
    ["Junior Software Engineer", ["software"]],
    ["Graduate Software Developer", ["software"]],
    ["Junior Full Stack Software Engineer", ["software", "fullstack"]],
    ["Junior Full-Stack Developer", ["software", "fullstack"]],
    ["Trainee DevOps Engineer", ["devops"]],
    ["Apprentice Cloud Support Engineer", ["cloud"]],
    ["Graduate Site Reliability Engineer", ["sre"]],
    ["Junior SRE", ["sre"]],
    ["Junior Front-End Developer", ["software", "frontend"]],
    ["Junior Back End Engineer", ["backend"]],
    ["Entry Level Systems Administrator", ["systems"]],
    ["Junior Platform Engineer", ["platform"]],
    ["Junior UI Developer", ["software", "ui"]],
    ["Junior Technical Project Manager", ["tech-pm"]],
    ["Software Engineering Intern", ["software"]],
    ["Summer Internship - Software Developer", ["software"]],
    ["Year in Industry Placement: Software Engineer", ["software"]],
    ["Jr. Backend Developer (Remote)", ["software", "backend"]],
  ])("accepts %s", (title, disciplines) => {
    expect(classifyTitle(title, "gb")).toEqual({ entryLevel: true, disciplines });
  });

  it.each([
    "Senior Graduate Scheme Mentor",
    "Senior Engineer – Graduate Scheme Mentor",
    "Associate Software Engineer",
    "Software Engineer II",
    "Software Engineer",
    "Lead Junior Developer Programme",
    "Sr. Junior Developer",
    "Principal DevOps Engineer",
    "Junior Engineering Manager",
    "Graduate Solutions Architect",
    "Senior Project Manager",
  ])("rejects %s", (title) => {
    expect(classifyTitle(title, "gb").entryLevel).toBe(false);
  });

  it("matches markers case-insensitively and as whole words only", () => {
    expect(classifyTitle("JUNIOR DEVOPS ENGINEER", "gb").entryLevel).toBe(true);
    // "internal" contains "intern"; "leading" contains "lead".
    expect(classifyTitle("Internal Systems Engineer", "gb").entryLevel).toBe(false);
    expect(classifyTitle("Junior Developer at a leading fintech", "gb").entryLevel).toBe(true);
  });

  it("returns no Disciplines for an entry-level title outside our fields", () => {
    expect(classifyTitle("Junior Data Analyst", "gb")).toEqual({ entryLevel: true, disciplines: [] });
  });
});

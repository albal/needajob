import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { emptyResponse, job, stubApi } from "./test-utils";

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  window.localStorage.clear();
});

const withJobs = (...jobs: ReturnType<typeof job>[]) =>
  stubApi(() => emptyResponse({ total: jobs.length, jobs, updatedAt: new Date().toISOString() }));

describe("Saved Jobs", () => {
  it("saves a Job from the results and lists it with when it was saved", async () => {
    withJobs(job({ id: "1", title: "Junior DevOps Engineer" }), job({ id: "2", title: "Graduate SRE" }));
    const user = userEvent.setup();
    render(<App />);

    const card = await screen.findByRole("article", { name: "Junior DevOps Engineer" });
    await user.click(within(card).getByRole("button", { name: "Save" }));
    expect(within(card).getByRole("button", { name: "Saved" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Saved jobs (1)" }));
    expect(window.location.search).toBe("?view=saved");
    const saved = screen.getByRole("article", { name: "Junior DevOps Engineer" });
    expect(within(saved).getByText("Saved just now")).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "Graduate SRE" })).not.toBeInTheDocument();
  });

  it("unsaves from the results or the list", async () => {
    withJobs(job({ id: "1", title: "Junior DevOps Engineer" }));
    const user = userEvent.setup();
    render(<App />);

    const card = await screen.findByRole("article", { name: "Junior DevOps Engineer" });
    await user.click(within(card).getByRole("button", { name: "Save" }));
    await user.click(within(card).getByRole("button", { name: "Saved" }));
    expect(screen.getByRole("button", { name: "Saved jobs (0)" })).toBeInTheDocument();

    await user.click(within(card).getByRole("button", { name: "Save" }));
    await user.click(screen.getByRole("button", { name: "Saved jobs (1)" }));
    await user.click(screen.getByRole("button", { name: "Saved" }));
    expect(screen.getByText(/no saved jobs yet/i)).toBeInTheDocument();
  });

  it("keeps Saved Jobs across visits, even after the Job leaves the Job Pool", async () => {
    withJobs(job({ id: "1", title: "Junior DevOps Engineer", salaryMin: 30000 }));
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    const card = await screen.findByRole("article", { name: "Junior DevOps Engineer" });
    await user.click(within(card).getByRole("button", { name: "Save" }));
    unmount();

    vi.restoreAllMocks();
    withJobs();
    window.history.replaceState(null, "", "/?view=saved");
    render(<App />);

    const saved = screen.getByRole("article", { name: "Junior DevOps Engineer" });
    expect(within(saved).getByText("£30,000")).toBeInTheDocument();
    expect(within(saved).getByRole("link", { name: "Apply" })).toHaveAttribute("href", "https://www.adzuna.co.uk/jobs/land/ad/1");
  });

  it("shows a Job already saved as saved in later results", async () => {
    window.localStorage.setItem(
      "needajob:saved",
      JSON.stringify([{ job: job({ id: "1" }), country: "gb", savedAt: new Date().toISOString() }]),
    );
    withJobs(job({ id: "1", title: "Junior DevOps Engineer" }));
    render(<App />);
    const card = await screen.findByRole("article", { name: "Junior DevOps Engineer" });
    expect(within(card).getByRole("button", { name: "Saved" })).toBeInTheDocument();
  });

  it("still lets you save when browser storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    withJobs(job({ id: "1", title: "Junior DevOps Engineer" }));
    const user = userEvent.setup();
    render(<App />);
    const card = await screen.findByRole("article", { name: "Junior DevOps Engineer" });
    await user.click(within(card).getByRole("button", { name: "Save" }));
    expect(screen.getByRole("button", { name: "Saved jobs (1)" })).toBeInTheDocument();
  });

  it("says that Saved Jobs stay on the device", async () => {
    withJobs();
    render(<App />);
    expect(screen.getByText(/saved jobs stay on this device/i)).toBeInTheDocument();
  });
});

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { emptyResponse, job, pagedResponder, stubApi } from "./test-utils";

beforeEach(() => window.history.replaceState(null, "", "/"));

describe("App", () => {
  it("shows a no-jobs-yet state before the first Harvest", async () => {
    stubApi(() => emptyResponse());
    render(<App />);
    expect(await screen.findByText(/no jobs yet/i)).toBeInTheDocument();
  });

  it("shows how fresh the Job Pool is", async () => {
    stubApi(() => emptyResponse({ updatedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString() }));
    render(<App />);
    expect(await screen.findByText("Jobs updated 7 hours ago")).toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    stubApi(() => emptyResponse({ updatedAt: new Date().toISOString() }));
    render(<App />);
    expect(await screen.findByText(/no entry-level jobs match/i)).toBeInTheDocument();
  });

  it("shows a Job card with everything a junior needs to decide", async () => {
    stubApi(() =>
      emptyResponse({
        total: 1,
        updatedAt: new Date().toISOString(),
        jobs: [
          job({
            id: "42",
            title: "Junior DevOps Engineer",
            company: "Acme Ltd",
            locationName: "Winchester, Hampshire",
            description: "Help us run our platform.",
            salaryMin: 28000,
            salaryMax: 32000,
            disciplines: ["devops", "platform"],
            redirectUrl: "https://www.adzuna.co.uk/jobs/land/ad/42?v=x",
          }),
        ],
      }),
    );
    render(<App />);

    const card = await screen.findByRole("article", { name: "Junior DevOps Engineer" });
    const c = within(card);
    expect(c.getByText("Acme Ltd · Winchester, Hampshire")).toBeInTheDocument();
    expect(c.getByText(/posted 3 days ago/i)).toBeInTheDocument();
    expect(c.getByText("£28,000 – £32,000")).toBeInTheDocument();
    expect(c.getByText("Help us run our platform.")).toBeInTheDocument();
    expect(c.getByText("DevOps Engineer")).toBeInTheDocument();
    expect(c.getByText("Platform Engineer")).toBeInTheDocument();
    expect(c.getByRole("link", { name: "Apply" })).toHaveAttribute("href", "https://www.adzuna.co.uk/jobs/land/ad/42?v=x");
    expect(c.getByRole("link", { name: /adzuna/i })).toHaveAttribute("href", "https://www.adzuna.co.uk");
    expect(screen.getByText("1 entry-level job")).toBeInTheDocument();
  });

  it("shows no salary when the advert doesn't state one", async () => {
    stubApi(() => emptyResponse({ total: 1, updatedAt: new Date().toISOString(), jobs: [job({ title: "Junior SRE" })] }));
    render(<App />);
    const card = await screen.findByRole("article", { name: "Junior SRE" });
    expect(within(card).queryByText(/£/)).not.toBeInTheDocument();
  });

  it("pages through results with the page in the URL, and Back returns", async () => {
    const jobs = Array.from({ length: 25 }, (_, i) => job({ title: `Junior Developer ${i + 1}` }));
    stubApi(pagedResponder(jobs));
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("25 entry-level jobs")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(20);
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(5);
    expect(window.location.search).toBe("?page=2");
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    window.history.back();
    expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument();
  });

  it("restores the page from a shared URL", async () => {
    window.history.replaceState(null, "", "/?page=2");
    const jobs = Array.from({ length: 25 }, (_, i) => job({ title: `Junior Developer ${i + 1}` }));
    stubApi(pagedResponder(jobs));
    render(<App />);
    expect(await screen.findByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Junior Developer 21" })).toBeInTheDocument();
  });

  it("narrows to chosen Disciplines, in the URL, restarting at page 1", async () => {
    window.history.replaceState(null, "", "/?page=2");
    const api = stubApi(() => emptyResponse({ updatedAt: new Date().toISOString() }));
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText(/no entry-level jobs match/i);

    await user.click(screen.getByRole("button", { name: "DevOps Engineer" }));
    await user.click(screen.getByRole("button", { name: "SRE" }));

    expect(window.location.search).toBe("?discipline=devops&discipline=sre");
    expect(screen.getByRole("button", { name: "DevOps Engineer" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "false");
    expect(String(api.mock.lastCall![0])).toBe("/api/jobs?discipline=devops&discipline=sre");

    await user.click(screen.getByRole("button", { name: "All" }));
    expect(window.location.search).toBe("");
  });

  it("narrows to a Location chosen from places in the Job Pool", async () => {
    const api = stubApi(() =>
      emptyResponse({
        updatedAt: new Date().toISOString(),
        locations: [
          { region: "London", counties: ["Central London"] },
          { region: "South East England", counties: ["Hampshire", "Surrey"] },
        ],
      }),
    );
    const user = userEvent.setup();
    render(<App />);
    const select = await screen.findByRole("combobox", { name: "Location" });
    await screen.findByRole("option", { name: "Hampshire" });

    expect(screen.getByRole("option", { name: "Anywhere in United Kingdom" })).toBeInTheDocument();

    await user.selectOptions(select, screen.getByRole("option", { name: "All of South East England" }));
    expect(window.location.search).toBe("?region=South+East+England");

    await user.selectOptions(select, screen.getByRole("option", { name: "Hampshire" }));
    expect(window.location.search).toBe("?region=South+East+England&county=Hampshire");
    expect(String(api.mock.lastCall![0])).toBe("/api/jobs?region=South+East+England&county=Hampshire");

    await user.selectOptions(select, screen.getByRole("option", { name: "Anywhere in United Kingdom" }));
    expect(window.location.search).toBe("");
  });
});

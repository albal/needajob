import { useEffect, useState } from "react";
import { findCountry } from "../core/countries";
import type { JobsResponse } from "../core/types";
import { fetchJobs } from "./api";
import { timeAgo } from "./format";
import { JobCard } from "./JobCard";
import { SearchForm } from "./SearchForm";
import { readStored, writeStored } from "./storage";
import { useUrlParams } from "./useUrlParams";

const COUNTRY_KEY = "needajob:country";

export function App() {
  const [params, setUrlParams] = useUrlParams();
  const [result, setResult] = useState<JobsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The URL wins; then the Country last chosen on this device; then the Worker's default.
  const apiParams = new URLSearchParams(params);
  const stored = readStored<string>(COUNTRY_KEY);
  if (!apiParams.has("country") && stored && findCountry(stored)) apiParams.set("country", stored);
  const query = apiParams.toString();

  const setParams = (next: URLSearchParams) => {
    const chosen = next.get("country");
    if (chosen) writeStored(COUNTRY_KEY, chosen);
    setUrlParams(next);
  };

  useEffect(() => {
    let current = true;
    setError(null);
    fetchJobs(new URLSearchParams(query))
      .then((r) => current && setResult(r))
      .catch((e: Error) => current && setError(e.message));
    return () => {
      current = false;
    };
  }, [query]);

  const goToPage = (page: number) => {
    const next = new URLSearchParams(params);
    if (page === 1) next.delete("page");
    else next.set("page", String(page));
    setParams(next);
    window.scrollTo?.({ top: 0 });
  };

  const country = result && findCountry(result.country);
  const pages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;

  return (
    <div className="page">
      <header className="header">
        <h1>needajob</h1>
        <p className="tagline">Entry-level tech jobs only.</p>
      </header>
      <SearchForm
        params={params}
        locations={result?.locations ?? []}
        country={apiParams.get("country") ?? result?.country ?? "gb"}
        countryName={country?.name ?? "the country"}
        onChange={setParams}
      />
      <main>
        {error && <p role="alert">{error}</p>}
        {!error && !result && <p aria-busy="true">Loading jobs…</p>}
        {result?.updatedAt && <p className="updated">Jobs updated {timeAgo(result.updatedAt)}</p>}
        {result && result.total === 0 && (
          <p className="empty">
            {result.updatedAt === null
              ? "No jobs yet — check back soon."
              : "No entry-level jobs match this search."}
          </p>
        )}
        {result && country && result.total > 0 && (
          <>
            <p className="total">
              {result.total} entry-level job{result.total === 1 ? "" : "s"}
            </p>
            <div className="results">
              {result.jobs.map((job) => (
                <JobCard key={job.id} job={job} country={country} />
              ))}
            </div>
            <nav className="pagination" aria-label="Pagination">
              <button type="button" disabled={result.page <= 1} onClick={() => goToPage(result.page - 1)}>
                Previous
              </button>
              <span>
                Page {result.page} of {pages}
              </span>
              <button type="button" disabled={result.page >= pages} onClick={() => goToPage(result.page + 1)}>
                Next
              </button>
            </nav>
          </>
        )}
      </main>
    </div>
  );
}

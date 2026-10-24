import { useEffect, useState } from "react";
import { findCountry } from "../core/countries";
import type { JobsResponse } from "../core/types";
import { fetchJobs } from "./api";
import { timeAgo } from "./format";
import { JobCard } from "./JobCard";
import { SearchForm } from "./SearchForm";
import { readStored, writeStored } from "./storage";
import { useSavedJobs } from "./useSavedJobs";
import { useUrlParams } from "./useUrlParams";

const COUNTRY_KEY = "needajob:country";

export function App() {
  const [params, setUrlParams] = useUrlParams();
  const savedJobs = useSavedJobs();
  const showSaved = params.get("view") === "saved";

  const setParams = (next: URLSearchParams) => {
    const chosen = next.get("country");
    if (chosen) writeStored(COUNTRY_KEY, chosen);
    setUrlParams(next);
  };

  const setView = (saved: boolean) => {
    const next = new URLSearchParams(params);
    if (saved) next.set("view", "saved");
    else next.delete("view");
    setUrlParams(next);
  };

  return (
    <div className="page">
      <header className="header">
        <h1>needajob</h1>
        <p className="tagline">Entry-level tech jobs only.</p>
        <nav className="views" aria-label="Views">
          <button type="button" className="toggle" aria-pressed={!showSaved} onClick={() => setView(false)}>
            Search
          </button>
          <button type="button" className="toggle" aria-pressed={showSaved} onClick={() => setView(true)}>
            Saved jobs ({savedJobs.saved.length})
          </button>
        </nav>
      </header>
      {showSaved ? (
        <SavedList savedJobs={savedJobs} />
      ) : (
        <SearchView params={params} setParams={setParams} savedJobs={savedJobs} />
      )}
      <footer className="footer">
        <p>Saved jobs stay on this device. Nothing about them is sent anywhere.</p>
      </footer>
    </div>
  );
}

function SavedList({ savedJobs }: { savedJobs: ReturnType<typeof useSavedJobs> }) {
  if (savedJobs.saved.length === 0) {
    return <p className="empty">No saved jobs yet. Save jobs from your search results to find them here.</p>;
  }
  return (
    <main className="results">
      {savedJobs.saved.map(({ job, country, savedAt }) => {
        const c = findCountry(country) ?? findCountry("gb")!;
        return (
          <JobCard
            key={job.id}
            job={job}
            country={c}
            saved
            savedAt={savedAt}
            onToggleSave={() => savedJobs.unsave(job.id)}
          />
        );
      })}
    </main>
  );
}

interface SearchViewProps {
  params: URLSearchParams;
  setParams: (next: URLSearchParams) => void;
  savedJobs: ReturnType<typeof useSavedJobs>;
}

function SearchView({ params, setParams, savedJobs }: SearchViewProps) {
  const [result, setResult] = useState<JobsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The URL wins; then the Country last chosen on this device; then the Worker's default.
  const apiParams = new URLSearchParams(params);
  apiParams.delete("view");
  const stored = readStored<string>(COUNTRY_KEY);
  if (!apiParams.has("country") && stored && findCountry(stored)) apiParams.set("country", stored);
  const query = apiParams.toString();

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
    <>
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
                <JobCard
                  key={job.id}
                  job={job}
                  country={country}
                  saved={savedJobs.isSaved(job.id)}
                  onToggleSave={() =>
                    savedJobs.isSaved(job.id) ? savedJobs.unsave(job.id) : savedJobs.save(job, country.code)
                  }
                />
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
    </>
  );
}

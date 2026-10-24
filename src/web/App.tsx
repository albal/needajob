import { useEffect, useState } from "react";
import type { JobsResponse } from "../core/types";
import { fetchJobs } from "./api";

export function App() {
  const [result, setResult] = useState<JobsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs(new URLSearchParams())
      .then(setResult)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div className="page">
      <header className="header">
        <h1>needajob</h1>
        <p className="tagline">Entry-level tech jobs only.</p>
      </header>
      <main>
        {error && <p role="alert">{error}</p>}
        {!error && !result && <p aria-busy="true">Loading jobs…</p>}
        {result && result.total === 0 && (
          <p className="empty">
            {result.updatedAt === null
              ? "No jobs yet — check back soon."
              : "No entry-level jobs match this search."}
          </p>
        )}
      </main>
    </div>
  );
}

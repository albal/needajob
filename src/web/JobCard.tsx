import type { Country } from "../core/countries";
import type { Job } from "../core/types";
import { DISCIPLINES } from "../core/word-lists";
import { formatSalary, timeAgo } from "./format";

const disciplineName = (slug: string) => DISCIPLINES.find((d) => d.slug === slug)?.name ?? slug;

export function JobCard({ job, country }: { job: Job; country: Country }) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, country.currency);
  return (
    <article className="card" aria-labelledby={`job-${job.id}`}>
      <h2 id={`job-${job.id}`} className="card-title">
        {job.title}
      </h2>
      <p className="card-meta">
        {[job.company, job.locationName].filter(Boolean).join(" · ")}
      </p>
      <p className="card-meta">
        Posted {timeAgo(job.created)}
        {salary && <> · <span className="salary">{salary}</span></>}
      </p>
      <p className="card-description">{job.description}</p>
      <ul className="chips" aria-label="Disciplines">
        {job.disciplines.map((d) => (
          <li key={d} className="chip">
            {disciplineName(d)}
          </li>
        ))}
      </ul>
      <div className="card-actions">
        <a className="button" href={job.redirectUrl} target="_blank" rel="noopener">
          Apply
        </a>
        <a className="adzuna" href={country.adzunaUrl} target="_blank" rel="noopener">
          Jobs by <strong>Adzuna</strong>
        </a>
      </div>
    </article>
  );
}

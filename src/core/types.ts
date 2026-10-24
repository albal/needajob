export type DisciplineSlug =
  | "software"
  | "backend"
  | "frontend"
  | "fullstack"
  | "ui"
  | "tech-pm"
  | "systems"
  | "cloud"
  | "devops"
  | "platform"
  | "sre";

/** An Entry-Level Job as kept in a Job Pool and returned by the API. */
export interface Job {
  id: string;
  title: string;
  company?: string;
  region?: string;
  county?: string;
  locationName?: string;
  /** Trimmed snippet of Adzuna's description. */
  description: string;
  /** ISO date-time the advert was created. */
  created: string;
  redirectUrl: string;
  /** Stated Salary only; Adzuna's predicted salaries are never kept. */
  salaryMin?: number;
  salaryMax?: number;
  disciplines: DisciplineSlug[];
}

export interface JobPool {
  country: string;
  updatedAt: string;
  jobs: Job[];
}

export interface LocationOption {
  region: string;
  counties: string[];
}

export interface JobsResponse {
  country: string;
  page: number;
  pageSize: number;
  total: number;
  jobs: Job[];
  locations: LocationOption[];
  updatedAt: string | null;
}

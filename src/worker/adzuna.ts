import type { Job } from "../core/types";

/** The subset of an Adzuna search result we use. */
export interface AdzunaResult {
  id: string | number;
  title: string;
  description: string;
  created: string;
  redirect_url: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: string | number;
}

export interface AdzunaSearch {
  country: string;
  page: number;
  whatOr: string[];
}

const DESCRIPTION_LENGTH = 200;

export async function searchAdzuna(env: Env, { country, page, whatOr }: AdzunaSearch): Promise<AdzunaResult[]> {
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`);
  url.search = new URLSearchParams({
    app_id: env.ADZUNA_APP_ID,
    app_key: env.ADZUNA_APP_KEY,
    results_per_page: "50",
    category: "it-jobs",
    what_or: whatOr.join(" "),
    sort_by: "date",
  }).toString();

  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Adzuna ${country} page ${page} failed: ${res.status}`);
  const body = await res.json<{ results?: AdzunaResult[] }>();
  return body.results ?? [];
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " " };

/** Adzuna wraps matched keywords in <strong> and escapes entities. */
export function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (_, e: string) => ENTITIES[e] ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function snippet(text: string): string {
  if (text.length <= DESCRIPTION_LENGTH) return text;
  const cut = text.slice(0, DESCRIPTION_LENGTH);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,.;:]+$/, "")}…`;
}

export function toJob(result: AdzunaResult, disciplines: Job["disciplines"]): Job {
  const predicted = String(result.salary_is_predicted ?? "0") === "1";
  const area = result.location?.area ?? [];
  const job: Job = {
    id: String(result.id),
    title: plainText(result.title),
    company: result.company?.display_name,
    region: area[1],
    county: area[2],
    locationName: result.location?.display_name,
    description: snippet(plainText(result.description)),
    created: result.created,
    redirectUrl: result.redirect_url,
    salaryMin: predicted ? undefined : result.salary_min,
    salaryMax: predicted ? undefined : result.salary_max,
    disciplines,
  };
  // Drop absent optional fields so Job Pools stay compact.
  return Object.fromEntries(Object.entries(job).filter(([, v]) => v !== undefined)) as Job;
}

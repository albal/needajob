import { classifyTitle } from "../core/classify";
import { COUNTRIES } from "../core/countries";
import type { Job } from "../core/types";
import { WORD_LISTS, languagesFor } from "../core/word-lists";
import { plainText, searchAdzuna, toJob } from "./adzuna";
import { readPool, writePool } from "./pool-store";

/** Adzuna pages fetched per Harvest; high-volume Countries get more. */
export const HARVEST_PAGES: Record<string, number> = { gb: 2, us: 2 };

/**
 * The hourly cron Harvests one of this many groups of Countries per run, so
 * each Country is Harvested every 12 hours. That keeps Adzuna use to about
 * 42 calls a day, inside the 2,500-a-month key we share with jobscout, and
 * each run small enough for the free plan's CPU and subrequest limits.
 */
export const HARVEST_GROUPS = 12;

/** Jobs whose advert is older than this are dropped from the Job Pool. */
export const MAX_AGE_DAYS = 30;

export function countriesDueAt(time: Date): string[] {
  const group = time.getUTCHours() % HARVEST_GROUPS;
  return COUNTRIES.filter((_, i) => i % HARVEST_GROUPS === group).map((c) => c.code);
}

async function fetchEntryLevelJobs(env: Env, country: string): Promise<Job[]> {
  const whatOr = [...new Set(languagesFor(country).flatMap((l) => WORD_LISTS[l].harvestWords))];
  const jobs: Job[] = [];

  for (let page = 1; page <= (HARVEST_PAGES[country] ?? 1); page++) {
    const results = await searchAdzuna(env, { country, page, whatOr });
    for (const result of results) {
      const { entryLevel, disciplines } = classifyTitle(plainText(result.title), country);
      if (entryLevel && disciplines.length > 0) jobs.push(toJob(result, disciplines));
    }
    if (results.length < 50) break;
  }
  return jobs;
}

/**
 * Merges a Country's newest Entry-Level Jobs into its Job Pool. If Adzuna
 * fails, the existing Job Pool is left untouched.
 */
export async function harvestCountry(env: Env, country: string, now: Date): Promise<void> {
  let fresh: Job[];
  try {
    fresh = await fetchEntryLevelJobs(env, country);
  } catch (error) {
    console.error(`Harvest failed for ${country}; keeping the existing Job Pool`, error);
    return;
  }

  const existing = await readPool(env.JOB_POOLS, country);
  const merged = new Map((existing?.jobs ?? []).map((j) => [j.id, j]));
  for (const job of fresh) merged.set(job.id, job);

  const cutoff = now.getTime() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const jobs = [...merged.values()].filter((j) => new Date(j.created).getTime() >= cutoff);

  await writePool(env.JOB_POOLS, { country, updatedAt: now.toISOString(), jobs });
}

/** Harvests the Countries due at `now`. */
export async function harvest(env: Env, now: Date): Promise<void> {
  for (const country of countriesDueAt(now)) {
    await harvestCountry(env, country, now);
  }
}

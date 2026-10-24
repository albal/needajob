import { classifyTitle } from "../core/classify";
import type { Job } from "../core/types";
import { WORD_LISTS, languagesFor } from "../core/word-lists";
import { plainText, searchAdzuna, toJob } from "./adzuna";
import { writePool } from "./pool-store";

/** Adzuna pages fetched per Harvest for each Country. */
export const HARVEST_PAGES: Record<string, number> = { gb: 3 };

export async function harvestCountry(env: Env, country: string, now: Date): Promise<void> {
  const whatOr = [...new Set(languagesFor(country).flatMap((l) => WORD_LISTS[l].harvestWords))];
  const jobs = new Map<string, Job>();

  for (let page = 1; page <= (HARVEST_PAGES[country] ?? 1); page++) {
    const results = await searchAdzuna(env, { country, page, whatOr });
    for (const result of results) {
      const { entryLevel, disciplines } = classifyTitle(plainText(result.title), country);
      if (!entryLevel || disciplines.length === 0) continue;
      jobs.set(String(result.id), toJob(result, disciplines));
    }
    if (results.length < 50) break;
  }

  await writePool(env.JOB_POOLS, { country, updatedAt: now.toISOString(), jobs: [...jobs.values()] });
}

export async function harvest(env: Env, now = new Date()): Promise<void> {
  for (const country of Object.keys(HARVEST_PAGES)) {
    await harvestCountry(env, country, now);
  }
}

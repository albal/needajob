import type { JobPool } from "../core/types";

const key = (country: string) => `pool:${country}`;

export function readPool(kv: KVNamespace, country: string): Promise<JobPool | null> {
  return kv.get<JobPool>(key(country), "json");
}

export function writePool(kv: KVNamespace, pool: JobPool): Promise<void> {
  return kv.put(key(pool.country), JSON.stringify(pool));
}

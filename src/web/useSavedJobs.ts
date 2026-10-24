import { useCallback, useState } from "react";
import type { Job, SavedJob } from "../core/types";
import { readStored, writeStored } from "./storage";

const KEY = "needajob:saved";

export interface SavedJobs {
  /** Most recently saved first. */
  saved: SavedJob[];
  isSaved: (id: string) => boolean;
  save: (job: Job, country: string) => void;
  unsave: (id: string) => void;
}

export function useSavedJobs(): SavedJobs {
  const [saved, setSaved] = useState<SavedJob[]>(() => readStored<SavedJob[]>(KEY) ?? []);

  const update = useCallback((change: (current: SavedJob[]) => SavedJob[]) => {
    setSaved((current) => {
      const next = change(current);
      writeStored(KEY, next);
      return next;
    });
  }, []);

  const save = useCallback(
    (job: Job, country: string) =>
      update((current) =>
        current.some((s) => s.job.id === job.id)
          ? current
          : [{ job, country, savedAt: new Date().toISOString() }, ...current],
      ),
    [update],
  );

  const unsave = useCallback((id: string) => update((current) => current.filter((s) => s.job.id !== id)), [update]);

  const isSaved = useCallback((id: string) => saved.some((s) => s.job.id === id), [saved]);

  return { saved, isSaved, save, unsave };
}

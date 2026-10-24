import type { DisciplineSlug } from "./types";
import { DISCIPLINES, WORD_LISTS, languagesFor } from "./word-lists";

export interface Classification {
  entryLevel: boolean;
  disciplines: DisciplineSlug[];
}

/** Lowercases, strips accents and turns punctuation into spaces, padded for whole-word matching. */
export function normalise(text: string): string {
  const words = text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
  return ` ${words} `;
}

const contains = (normalised: string, phrase: string) => normalised.includes(normalise(phrase));

/**
 * Decides from a Job title alone whether it is an Entry-Level Job, and which
 * Disciplines it matches.
 */
export function classifyTitle(title: string, country: string): Classification {
  const lists = languagesFor(country).map((lang) => WORD_LISTS[lang]);
  const normalised = normalise(title);

  const disciplineTerms: string[] = [];
  const disciplines = DISCIPLINES.filter(({ slug }) => {
    const matched = lists.flatMap((l) => l.disciplines[slug] ?? []).filter((t) => contains(normalised, t));
    disciplineTerms.push(...matched);
    return matched.length > 0;
  }).map(({ slug }) => slug);

  // A Seniority Marker inside a Discipline Term (the "manager" in "project
  // manager") describes the field, not the level, so it doesn't count.
  let withoutTerms = normalised;
  for (const term of disciplineTerms) withoutTerms = withoutTerms.replaceAll(normalise(term), " ");

  const hasEntryMarker = lists.some((l) => l.entryLevel.some((m) => contains(normalised, m)));
  const hasSeniorityMarker = lists.some((l) => l.seniority.some((m) => contains(withoutTerms, m)));

  return { entryLevel: hasEntryMarker && !hasSeniorityMarker, disciplines };
}

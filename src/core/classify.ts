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

interface CountryLists {
  entryLevel: string[];
  seniority: string[];
  disciplines: { slug: DisciplineSlug; terms: string[] }[];
}

// Harvests classify hundreds of titles per run, so each Country's lists are
// normalised once rather than per title.
const cache = new Map<string, CountryLists>();

function listsFor(country: string): CountryLists {
  let lists = cache.get(country);
  if (!lists) {
    const languages = languagesFor(country).map((lang) => WORD_LISTS[lang]);
    const all = (pick: (l: (typeof languages)[number]) => string[]) => [...new Set(languages.flatMap(pick).map(normalise))];
    lists = {
      entryLevel: all((l) => l.entryLevel),
      seniority: all((l) => l.seniority),
      disciplines: DISCIPLINES.map(({ slug }) => ({ slug, terms: all((l) => l.disciplines[slug] ?? []) })),
    };
    cache.set(country, lists);
  }
  return lists;
}

/**
 * Decides from a Job title alone whether it is an Entry-Level Job, and which
 * Disciplines it matches.
 */
export function classifyTitle(title: string, country: string): Classification {
  const lists = listsFor(country);
  const normalised = normalise(title);

  const disciplineTerms: string[] = [];
  const disciplines = lists.disciplines
    .filter(({ terms }) => {
      const matched = terms.filter((t) => normalised.includes(t));
      disciplineTerms.push(...matched);
      return matched.length > 0;
    })
    .map(({ slug }) => slug);

  // A Seniority Marker inside a Discipline Term (the "manager" in "project
  // manager") describes the field, not the level, so it doesn't count.
  let withoutTerms = normalised;
  for (const term of disciplineTerms) withoutTerms = withoutTerms.replaceAll(term, " ");

  const hasEntryMarker = lists.entryLevel.some((m) => normalised.includes(m));
  const hasSeniorityMarker = lists.seniority.some((m) => withoutTerms.includes(m));

  return { entryLevel: hasEntryMarker && !hasSeniorityMarker, disciplines };
}

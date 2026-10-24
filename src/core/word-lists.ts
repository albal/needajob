import type { DisciplineSlug } from "./types";

export const DISCIPLINES: { slug: DisciplineSlug; name: string }[] = [
  { slug: "software", name: "Software Engineer" },
  { slug: "backend", name: "Backend Engineer" },
  { slug: "frontend", name: "Frontend Engineer" },
  { slug: "fullstack", name: "Full Stack Engineer" },
  { slug: "ui", name: "UI Developer" },
  { slug: "tech-pm", name: "Tech Project Manager" },
  { slug: "systems", name: "Systems Engineer" },
  { slug: "cloud", name: "Cloud Engineer" },
  { slug: "devops", name: "DevOps Engineer" },
  { slug: "platform", name: "Platform Engineer" },
  { slug: "sre", name: "SRE" },
];

export type Language = "en";

export interface LanguageLists {
  /** Entry-Level Markers, as whole words or phrases. */
  entryLevel: string[];
  /** Seniority Markers, as whole words or phrases. */
  seniority: string[];
  /** Discipline Terms, as whole words or phrases. */
  disciplines: Partial<Record<DisciplineSlug, string[]>>;
  /** Single words sent to Adzuna's `what_or` when Harvesting. */
  harvestWords: string[];
}

// Matching normalises case, accents and punctuation, so "Front-End" is written
// here as "front end" and "Sr." as "sr".
export const WORD_LISTS: Record<Language, LanguageLists> = {
  en: {
    entryLevel: [
      "junior",
      "jr",
      "graduate",
      "grad",
      "entry level",
      "trainee",
      "apprentice",
      "apprenticeship",
      "intern",
      "internship",
      "placement",
    ],
    seniority: [
      "senior",
      "sr",
      "lead",
      "principal",
      "staff",
      "head",
      "manager",
      "director",
      "architect",
      "chief",
      "vp",
      "mid level",
      "ii",
      "iii",
      "iv",
    ],
    disciplines: {
      software: [
        "software engineer",
        "software engineering",
        "software developer",
        "software development",
        "developer",
        "programmer",
      ],
      backend: ["backend", "back end"],
      frontend: ["frontend", "front end", "web developer"],
      fullstack: ["full stack", "fullstack"],
      ui: [
        "ui developer",
        "ui engineer",
        "user interface developer",
        "user interface engineer",
      ],
      "tech-pm": [
        "project manager",
        "project management",
        "project coordinator",
        "delivery manager",
        "scrum master",
      ],
      systems: [
        "systems engineer",
        "system engineer",
        "systems administrator",
        "system administrator",
        "sysadmin",
        "infrastructure engineer",
      ],
      cloud: ["cloud"],
      devops: ["devops", "dev ops"],
      platform: ["platform engineer", "platform engineering", "platform developer"],
      sre: ["sre", "site reliability", "reliability engineer"],
    },
    harvestWords: [
      "junior",
      "graduate",
      "trainee",
      "apprentice",
      "apprenticeship",
      "intern",
      "internship",
      "placement",
      "entry",
    ],
  },
};

/** Languages whose lists apply in each Country, beyond English. */
export const COUNTRY_LANGUAGES: Record<string, Language[]> = {
  gb: [],
};

export function languagesFor(country: string): Language[] {
  return ["en", ...(COUNTRY_LANGUAGES[country] ?? [])];
}

export interface Country {
  code: string;
  name: string;
  currency: string;
  /** Adzuna's site for this Country, which attribution links must point to. */
  adzunaUrl: string;
}

export const COUNTRIES: Country[] = [
  { code: "gb", name: "United Kingdom", currency: "GBP", adzunaUrl: "https://www.adzuna.co.uk" },
  { code: "us", name: "United States", currency: "USD", adzunaUrl: "https://www.adzuna.com" },
  { code: "at", name: "Austria", currency: "EUR", adzunaUrl: "https://www.adzuna.at" },
  { code: "au", name: "Australia", currency: "AUD", adzunaUrl: "https://www.adzuna.com.au" },
  { code: "be", name: "Belgium", currency: "EUR", adzunaUrl: "https://www.adzuna.be" },
  { code: "br", name: "Brazil", currency: "BRL", adzunaUrl: "https://www.adzuna.com.br" },
  { code: "ca", name: "Canada", currency: "CAD", adzunaUrl: "https://www.adzuna.ca" },
  { code: "ch", name: "Switzerland", currency: "CHF", adzunaUrl: "https://www.adzuna.ch" },
  { code: "de", name: "Germany", currency: "EUR", adzunaUrl: "https://www.adzuna.de" },
  { code: "es", name: "Spain", currency: "EUR", adzunaUrl: "https://www.adzuna.es" },
  { code: "fr", name: "France", currency: "EUR", adzunaUrl: "https://www.adzuna.fr" },
  { code: "in", name: "India", currency: "INR", adzunaUrl: "https://www.adzuna.in" },
  { code: "it", name: "Italy", currency: "EUR", adzunaUrl: "https://www.adzuna.it" },
  { code: "mx", name: "Mexico", currency: "MXN", adzunaUrl: "https://www.adzuna.com.mx" },
  { code: "nl", name: "Netherlands", currency: "EUR", adzunaUrl: "https://www.adzuna.nl" },
  { code: "nz", name: "New Zealand", currency: "NZD", adzunaUrl: "https://www.adzuna.co.nz" },
  { code: "pl", name: "Poland", currency: "PLN", adzunaUrl: "https://www.adzuna.pl" },
  { code: "sg", name: "Singapore", currency: "SGD", adzunaUrl: "https://www.adzuna.sg" },
  { code: "za", name: "South Africa", currency: "ZAR", adzunaUrl: "https://www.adzuna.co.za" },
];

export function findCountry(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

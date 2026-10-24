import { COUNTRIES } from "../core/countries";
import type { LocationOption } from "../core/types";
import { DISCIPLINES } from "../core/word-lists";

interface Props {
  params: URLSearchParams;
  /** Places with Jobs in the current Job Pool. */
  locations: LocationOption[];
  country: string;
  countryName: string;
  /** Called with the new Search; any page is dropped so results restart at page 1. */
  onChange: (next: URLSearchParams) => void;
}

const SEP = "\t";

export function SearchForm({ params, locations, country, countryName, onChange }: Props) {
  const selected = new Set(params.getAll("discipline"));
  const region = params.get("region") ?? "";
  const county = params.get("county") ?? "";

  // Keep a shared URL's Location selectable even if the Pool no longer has it.
  const options = locations.some((l) => l.region === region) || !region
    ? locations
    : [...locations, { region, counties: county ? [county] : [] }];

  const chooseCountry = (code: string) => {
    const next = new URLSearchParams();
    next.set("country", code);
    for (const d of params.getAll("discipline")) next.append("discipline", d);
    onChange(next);
  };

  const chooseLocation = (value: string) => {
    const [r = "", c = ""] = value.split(SEP);
    const next = new URLSearchParams(params);
    next.delete("page");
    next.delete("region");
    next.delete("county");
    if (r) next.set("region", r);
    if (c) next.set("county", c);
    onChange(next);
  };

  const toggle = (slug: string) => {
    const next = new URLSearchParams(params);
    next.delete("page");
    next.delete("discipline");
    const disciplines = selected.has(slug) ? [...selected].filter((d) => d !== slug) : [...selected, slug];
    for (const d of DISCIPLINES) if (disciplines.includes(d.slug)) next.append("discipline", d.slug);
    onChange(next);
  };

  const clear = () => {
    const next = new URLSearchParams(params);
    next.delete("page");
    next.delete("discipline");
    onChange(next);
  };

  return (
    <form className="search" onSubmit={(e) => e.preventDefault()} aria-label="Search">
      <div className="fields">
        <label className="field">
          <span>Country</span>
          <select value={country} onChange={(e) => chooseCountry(e.target.value)}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Location</span>
          <select value={region ? `${region}${SEP}${county}` : ""} onChange={(e) => chooseLocation(e.target.value)}>
            <option value="">Anywhere in {countryName}</option>
            {options.map((l) => (
              <optgroup key={l.region} label={l.region}>
                <option value={`${l.region}${SEP}`}>All of {l.region}</option>
                {l.counties.map((c) => (
                  <option key={c} value={`${l.region}${SEP}${c}`}>
                    {c}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>
      <fieldset className="disciplines">
        <legend>Disciplines</legend>
        <div className="toggles">
          <button type="button" className="toggle" aria-pressed={selected.size === 0} onClick={clear}>
            All
          </button>
          {DISCIPLINES.map((d) => (
            <button
              key={d.slug}
              type="button"
              className="toggle"
              aria-pressed={selected.has(d.slug)}
              onClick={() => toggle(d.slug)}
            >
              {d.name}
            </button>
          ))}
        </div>
      </fieldset>
    </form>
  );
}

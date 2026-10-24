import { DISCIPLINES } from "../core/word-lists";

interface Props {
  params: URLSearchParams;
  /** Called with the new Search; any page is dropped so results restart at page 1. */
  onChange: (next: URLSearchParams) => void;
}

export function SearchForm({ params, onChange }: Props) {
  const selected = new Set(params.getAll("discipline"));

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

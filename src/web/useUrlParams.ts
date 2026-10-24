import { useCallback, useEffect, useState } from "react";

/** The page's query string as state; updates push a history entry so Back works. */
export function useUrlParams(): [URLSearchParams, (next: URLSearchParams) => void] {
  const [params, setParams] = useState(() => new URLSearchParams(window.location.search));

  useEffect(() => {
    const onPop = () => setParams(new URLSearchParams(window.location.search));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const update = useCallback((next: URLSearchParams) => {
    const query = next.toString();
    window.history.pushState(null, "", query ? `?${query}` : window.location.pathname);
    setParams(new URLSearchParams(next));
  }, []);

  return [params, update];
}

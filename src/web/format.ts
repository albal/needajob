const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** "just now", "3 hours ago", "1 day ago", "12 days ago". */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const ms = Math.max(0, now.getTime() - new Date(iso).getTime());
  if (ms < HOUR) return "just now";
  if (ms < DAY) {
    const h = Math.floor(ms / HOUR);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  const d = Math.floor(ms / DAY);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export function formatSalary(min: number | undefined, max: number | undefined, currency: string): string | null {
  const fmt = new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 });
  if (min !== undefined && max !== undefined && min !== max) return `${fmt.format(min)} – ${fmt.format(max)}`;
  const one = min ?? max;
  return one === undefined ? null : fmt.format(one);
}

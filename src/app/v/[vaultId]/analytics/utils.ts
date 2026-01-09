export type SearchParams = Record<string, string | string[] | undefined>;

export function pickFirst(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

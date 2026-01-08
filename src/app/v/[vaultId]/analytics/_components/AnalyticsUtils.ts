// src/app/v/[vaultId]/analytics/_components/analyticsUtils.ts
export type Tab = "muscles" | "tendons";

export function roleWeight(role: string): number {
  switch (role) {
    case "PRIMARY":
      return 1;
    case "SECONDARY":
      return 0.5;
    case "STABILIZER":
      return 0.25;
    default:
      return 1;
  }
}

export function formatNumber(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "0";
  return Intl.NumberFormat().format(n);
}

export function formatKg(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "0";
  return Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(n);
}

export function buildHref(base: string, sp: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v != null && v !== "") qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

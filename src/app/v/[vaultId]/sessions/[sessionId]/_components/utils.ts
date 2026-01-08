// src/app/v/[vaultId]/sessions/[sessionId]/_components/utils.ts
import type { Modality, SetRow } from "./types";

export function isSetLogged(s: SetRow) {
  return s.reps !== null || s.weight_kg !== null || s.duration_sec !== null;
}

// src/app/v/[vaultId]/sessions/[sessionId]/_components/utils.ts
export function fmtSetLabel(
  modality: Modality,
  s: SetRow,
  opts?: { usesBodyweight?: boolean; bodyWeightKg?: number | null }
) {
  if (!isSetLogged(s)) return { top: null as string | null, sub: null as string | null };

  const usesBW = !!opts?.usesBodyweight;
  const bw = opts?.bodyWeightKg ?? null;

  if (modality === "REPS") {
    const top = s.reps != null ? String(s.reps) : "✓";

    if (usesBW && bw != null) {
      const external = s.weight_kg ?? 0;
      const total = bw + external;
      return { top, sub: `tot ${total.toFixed(1)}kg` };
    }

    const sub = s.weight_kg != null ? `${s.weight_kg}kg` : null;
    return { top, sub };
  }

  const top = s.duration_sec != null ? String(s.duration_sec) : "✓";

  if (usesBW && bw != null) {
    return { top, sub: `tot ${bw.toFixed(1)}kg` };
  }

  return { top, sub: "s" };
}


export function safeNumber(input: string) {
  const n = Number(input);
  return Number.isFinite(n) ? n : 0;
}

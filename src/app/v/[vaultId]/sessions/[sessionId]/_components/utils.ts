// src/app/v/[vaultId]/sessions/[sessionId]/_components/utils.ts
import type { Modality, SetRow } from "./types";

export function isSetLogged(s: SetRow) {
  return s.reps !== null || s.weight_kg !== null || s.duration_sec !== null;
}

export function fmtSetLabel(modality: Modality, s: SetRow) {
  if (!isSetLogged(s)) return { top: null as string | null, sub: null as string | null };

  if (modality === "REPS") {
    const top = s.reps != null ? String(s.reps) : "✓";
    const sub = s.weight_kg != null ? `${s.weight_kg}kg` : null;
    return { top, sub };
  }

  const top = s.duration_sec != null ? String(s.duration_sec) : "✓";
  return { top, sub: "s" };
}

export function safeNumber(input: string) {
  const n = Number(input);
  return Number.isFinite(n) ? n : 0;
}

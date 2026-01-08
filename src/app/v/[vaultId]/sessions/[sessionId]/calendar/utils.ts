import type { Filters, SummaryRow } from "./types";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function isoDateLocal(d: Date) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

export function daysGridLocal(year: number, month0: number) {
  const first = new Date(year, month0, 1);
  const firstDay = (first.getDay() + 6) % 7; // Mon=0..Sun=6
  const gridStart = new Date(year, month0, 1 - firstDay);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  }
  return days;
}

export function clampPct(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function pctDone(s: SummaryRow) {
  return s.planned_sets ? clampPct((s.logged_sets / s.planned_sets) * 100) : 0;
}

export function groupByDay(rows: SummaryRow[]) {
  const map = new Map<string, SummaryRow[]>();
  for (const s of rows) {
    const arr = map.get(s.session_date) ?? [];
    arr.push(s);
    map.set(s.session_date, arr);
  }
  return map;
}

export function applyFilters(byDay: Map<string, SummaryRow[]>, f: Filters) {
  const map = new Map<string, SummaryRow[]>();

  for (const [day, arr] of byDay.entries()) {
    let xs = arr;

    if (f.templateId !== "ALL") xs = xs.filter((s) => s.template_id === f.templateId);
    if (f.modality !== "ALL") xs = xs.filter((s) => s.modalities?.includes(f.modality));
    if (f.onlyPr) xs = xs.filter((s) => s.has_pr);

    if (xs.length) map.set(day, xs);
  }

  return map;
}

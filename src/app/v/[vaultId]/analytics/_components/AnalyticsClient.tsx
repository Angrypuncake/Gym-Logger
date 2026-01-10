// src/app/v/[vaultId]/analytics/_components/AnalyticsClient.tsx
"use client";

import type {
  Grain,
  MuscleDailyRow,
  MuscleWeeklyRow,
  TendonDailyRow,
  TendonWeeklyRow,
} from "@/db/analytics";
import AnalyticsHeader from "./AnalyticsHeader";
import TargetListCard, { TargetAgg } from "./TargetListCard";

import { buildHref, roleWeight, Tab } from "./AnalyticsUtils";
import PeriodDetailsCard, { PeriodAgg } from "./PeriodDetailsCard";

type Row = MuscleWeeklyRow | MuscleDailyRow | TendonWeeklyRow | TendonDailyRow;

export default function AnalyticsClient(props: {
  vaultId: string;
  tab: Tab;
  grain: Grain;
  weeks: number;
  q: string;
  sort: string;
  targetId?: string;
  fromISO: string;
  toISO: string;
  rawRows: Row[];
}) {
  const { vaultId, tab, grain, weeks, q, sort, targetId, fromISO, toISO, rawRows } = props;

  const periodKey = grain === "day" ? "day_start" : "week_start";

  // -------- aggregate per target --------
  const byTarget = new Map<string, TargetAgg>();

  for (const r of rawRows) {
    const id = (r as any).target_id as string;
    const name = (r as any).target_name as string;

    const sets = Number((r as any).set_count ?? 0);
    const iso = Number((r as any).total_iso_sec ?? 0);

    const reps = tab === "muscles" ? Number((r as any).total_reps ?? 0) : 0;
    const ton = tab === "muscles" ? Number((r as any).total_tonnage_kg ?? 0) : 0;

    const isoLoad = tab === "tendons" ? Number((r as any).iso_exposure_kg_sec ?? 0) : 0;

    const role = tab === "muscles" ? String((r as any).role ?? "") : "";
    const eff = tab === "muscles" ? sets * roleWeight(role) : sets;

    const cur =
      byTarget.get(id) ??
      ({
        target_id: id,
        target_name: name,
        sets: 0,
        effective_sets: 0,
        reps: 0,
        iso_sec: 0,
        tonnage_kg: 0,
        iso_load_kg_sec: 0,
      } as TargetAgg);

    cur.sets += sets;
    cur.effective_sets += eff;
    cur.reps += reps;
    cur.iso_sec += iso;
    cur.tonnage_kg += ton;
    cur.iso_load_kg_sec += isoLoad;

    byTarget.set(id, cur);
  }

  let targets = Array.from(byTarget.values());
  const qLower = q.trim().toLowerCase();
  if (qLower) targets = targets.filter((t) => t.target_name.toLowerCase().includes(qLower));

  targets.sort((a, b) => {
    const key = sort.toLowerCase();

    if (tab === "muscles") {
      if (key === "effective_sets") return b.effective_sets - a.effective_sets;
      if (key === "sets") return b.sets - a.sets;
      if (key === "reps") return b.reps - a.reps;
      if (key === "iso") return b.iso_sec - a.iso_sec;
      if (key === "tonnage") return b.tonnage_kg - a.tonnage_kg;
      return b.effective_sets - a.effective_sets;
    }

    // tendons
    if (key === "iso_load") return b.iso_load_kg_sec - a.iso_load_kg_sec;
    if (key === "iso") return b.iso_sec - a.iso_sec;
    if (key === "sets") return b.sets - a.sets;
    return b.iso_load_kg_sec - a.iso_load_kg_sec;
  });

  const selectedIdFromUrl = targetId;
  const selectedId =
    (selectedIdFromUrl && targets.some((t) => t.target_id === selectedIdFromUrl) && selectedIdFromUrl) ||
    targets[0]?.target_id;

  // -------- aggregate per period for selected target --------
  const periodMap = new Map<string, PeriodAgg>();

  if (selectedId) {
    for (const r of rawRows) {
      const id = (r as any).target_id as string;
      if (id !== selectedId) continue;

      const p = String((r as any)[periodKey]);
      const sets = Number((r as any).set_count ?? 0);
      const iso = Number((r as any).total_iso_sec ?? 0);
      const reps = tab === "muscles" ? Number((r as any).total_reps ?? 0) : 0;
      const ton = tab === "muscles" ? Number((r as any).total_tonnage_kg ?? 0) : 0;
      const isoLoad = tab === "tendons" ? Number((r as any).iso_exposure_kg_sec ?? 0) : 0;

      const role = tab === "muscles" ? String((r as any).role ?? "") : "";
      const eff = tab === "muscles" ? sets * roleWeight(role) : sets;

      const cur =
        periodMap.get(p) ??
        ({
          period_start: p,
          sets: 0,
          effective_sets: 0,
          reps: 0,
          iso_sec: 0,
          tonnage_kg: 0,
          iso_load_kg_sec: 0,
        } as PeriodAgg);

      cur.sets += sets;
      cur.effective_sets += eff;
      cur.reps += reps;
      cur.iso_sec += iso;
      cur.tonnage_kg += ton;
      cur.iso_load_kg_sec += isoLoad;

      periodMap.set(p, cur);
    }
  }

  const periodSeries = Array.from(periodMap.values()).sort((a, b) => a.period_start.localeCompare(b.period_start));
  const selectedName = selectedId ? byTarget.get(selectedId)?.target_name : undefined;

  // -------- href builders --------
  const base = `/v/${vaultId}/analytics`;

  const tabHref = (nextTab: Tab) =>
    buildHref(base, {
      tab: nextTab,
      grain,
      weeks: String(weeks),
      q: q || undefined,
      sort: undefined,
      target: undefined,
    });

  const grainHref = (g: Grain) =>
    buildHref(base, {
      tab,
      grain: g,
      weeks: String(weeks),
      q: q || undefined,
      sort: sort || undefined,
      target: selectedId,
    });

  const rangeHref = (w: number) =>
    buildHref(base, {
      tab,
      grain,
      weeks: String(w),
      q: q || undefined,
      sort: sort || undefined,
      target: selectedId,
    });

  const rowHref = (id: string) =>
    buildHref(base, {
      tab,
      grain,
      weeks: String(weeks),
      q: q || undefined,
      sort: sort || undefined,
      target: id,
    });

  const sortHref = (s: string) =>
    buildHref(base, {
      tab,
      grain,
      weeks: String(weeks),
      q: q || undefined,
      sort: s,
      target: selectedId,
    });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <AnalyticsHeader
        vaultId={vaultId}
        tab={tab}
        grain={grain}
        weeks={weeks}
        tabHref={tabHref}
        grainHref={grainHref}
        rangeHref={rangeHref}
      />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TargetListCard
          tab={tab}
          fromISO={fromISO}
          toISO={toISO}
          q={q}
          sort={sort}
          targets={targets}
          selectedId={selectedId}
          rowHref={rowHref}
          sortHref={sortHref}
        />

        <PeriodDetailsCard
          tab={tab}
          grain={grain}
          weeks={weeks}
          selectedName={selectedName}
          selectedId={selectedId}
          periodSeries={periodSeries}
        />
      </div>
    </main>
  );
}

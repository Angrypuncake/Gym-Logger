// src/app/v/[vaultId]/analytics/_components/AnalyticsClient.tsx
"use client";

import type { MuscleWeeklyRow, TendonWeeklyRow } from "@/db/analytics";
import AnalyticsHeader from "./AnalyticsHeader";
import TargetListCard, { TargetAgg } from "./TargetListCard";
import WeeklyDetailsCard, { WeekAgg } from "./WeeklyDetailsCard";
import { buildHref, roleWeight, Tab } from "./AnalyticsUtils";


export default function AnalyticsClient(props: {
  vaultId: string;
  tab: Tab;
  weeks: number;
  q: string;
  sort: string;
  targetId?: string;
  fromISO: string;
  toISO: string;
  rawRows: Array<MuscleWeeklyRow | TendonWeeklyRow>;
}) {
  const { vaultId, tab, weeks, q, sort, targetId, fromISO, toISO, rawRows } = props;

  // -------- aggregate per target --------
  const byTarget = new Map<string, TargetAgg>();

  for (const r of rawRows) {
    const id = (r as any).target_id as string;
    const name = (r as any).target_name as string;

    const sets = Number((r as any).set_count ?? 0);
    const reps = Number((r as any).total_reps ?? 0);
    const iso = Number((r as any).total_iso_sec ?? 0);
    const ton = Number((r as any).total_tonnage_kg ?? 0);

    // NEW tendon metric
    const isoLoad = Number((r as any).total_iso_load_kg_sec ?? 0);

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
        avg_iso_load_kg: null,
      } as TargetAgg);

    cur.sets += sets;
    cur.effective_sets += eff;
    cur.reps += reps;
    cur.iso_sec += iso;
    cur.tonnage_kg += ton;
    cur.iso_load_kg_sec += isoLoad;
    cur.avg_iso_load_kg = cur.iso_sec > 0 ? cur.iso_load_kg_sec / cur.iso_sec : null;

    byTarget.set(id, cur);
  }

  let targets = Array.from(byTarget.values());
  const qLower = q.trim().toLowerCase();
  if (qLower) targets = targets.filter((t) => t.target_name.toLowerCase().includes(qLower));

  targets.sort((a, b) => {
    const key = sort.toLowerCase();
    if (tab === "muscles" && key === "effective_sets") return b.effective_sets - a.effective_sets;
    if (key === "sets") return b.sets - a.sets;
    if (key === "reps") return b.reps - a.reps;
    if (key === "iso") return b.iso_sec - a.iso_sec;

    if (tab === "tendons" && key === "iso_load") return b.iso_load_kg_sec - a.iso_load_kg_sec;
    if (tab === "muscles" && key === "tonnage") return b.tonnage_kg - a.tonnage_kg;

    return b.sets - a.sets;
  });

  // Selection: ensure selectedId exists in current filtered list
  const selectedIdFromUrl = targetId;
  const selectedId =
    (selectedIdFromUrl && targets.some((t) => t.target_id === selectedIdFromUrl) && selectedIdFromUrl) ||
    targets[0]?.target_id;

  // -------- aggregate per week for selected target --------
  const weekMap = new Map<string, WeekAgg>();

  if (selectedId) {
    for (const r of rawRows) {
      const id = (r as any).target_id as string;
      if (id !== selectedId) continue;

      const wk = String((r as any).week_start);
      const sets = Number((r as any).set_count ?? 0);
      const reps = Number((r as any).total_reps ?? 0);
      const iso = Number((r as any).total_iso_sec ?? 0);
      const ton = Number((r as any).total_tonnage_kg ?? 0);
      const isoLoad = Number((r as any).total_iso_load_kg_sec ?? 0);

      const role = tab === "muscles" ? String((r as any).role ?? "") : "";
      const eff = tab === "muscles" ? sets * roleWeight(role) : sets;

      const cur =
        weekMap.get(wk) ??
        ({
          week_start: wk,
          sets: 0,
          effective_sets: 0,
          reps: 0,
          iso_sec: 0,
          tonnage_kg: 0,
          iso_load_kg_sec: 0,
          avg_iso_load_kg: null,
        } as WeekAgg);

      cur.sets += sets;
      cur.effective_sets += eff;
      cur.reps += reps;
      cur.iso_sec += iso;
      cur.tonnage_kg += ton;
      cur.iso_load_kg_sec += isoLoad;
      cur.avg_iso_load_kg = cur.iso_sec > 0 ? cur.iso_load_kg_sec / cur.iso_sec : null;

      weekMap.set(wk, cur);
    }
  }

  const weeksSeries = Array.from(weekMap.values()).sort((a, b) => a.week_start.localeCompare(b.week_start));
  const selectedName = selectedId ? byTarget.get(selectedId)?.target_name : undefined;

  // -------- href builders --------
  const base = `/v/${vaultId}/analytics`;

  const tabHref = (nextTab: Tab) =>
    buildHref(base, {
      tab: nextTab,
      weeks: String(weeks),
      q: q || undefined,
      sort: undefined,
      target: undefined,
    });

  const rangeHref = (w: number) =>
    buildHref(base, {
      tab,
      weeks: String(w),
      q: q || undefined,
      sort: sort || undefined,
      target: selectedId,
    });

  const rowHref = (id: string) =>
    buildHref(base, {
      tab,
      weeks: String(weeks),
      q: q || undefined,
      sort: sort || undefined,
      target: id,
    });

  const sortHref = (s: string) =>
    buildHref(base, {
      tab,
      weeks: String(weeks),
      q: q || undefined,
      sort: s,
      target: selectedId,
    });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <AnalyticsHeader vaultId={vaultId} tab={tab} weeks={weeks} tabHref={tabHref} rangeHref={rangeHref} />

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

        <WeeklyDetailsCard
          tab={tab}
          weeks={weeks}
          selectedName={selectedName}
          selectedId={selectedId}
          weeksSeries={weeksSeries}
        />
      </div>
    </main>
  );
}

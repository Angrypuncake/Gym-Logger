// src/app/v/[vaultId]/analytics/_components/PeriodDetailsCard.tsx
"use client";

import { formatKg, formatNumber, Tab } from "./AnalyticsUtils";
import type { Grain } from "@/db/analytics";

export type PeriodAgg = {
  period_start: string; // week_start or day_start (string date)
  sets: number;
  effective_sets: number;
  reps: number;
  iso_sec: number;
  tonnage_kg: number;
  iso_load_kg_sec: number;
};

export default function PeriodDetailsCard(props: {
  tab: Tab;
  grain: Grain;
  weeks: number;
  selectedName?: string;
  selectedId?: string;
  periodSeries: PeriodAgg[];
}) {
  const { tab, grain, weeks, selectedName, selectedId, periodSeries } = props;
  const label = grain === "day" ? "Day" : "Week";
  const subtitle = grain === "day" ? "Daily totals" : "Weekly totals";

  return (
    <section className="rounded-lg border border-input lg:col-span-2">
      <div className="border-b border-input p-3">
        <div className="text-sm font-medium">{selectedName ?? "Select a target"}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {subtitle} across the last {weeks} weeks
        </div>
      </div>

      {!selectedId ? (
        <div className="p-4 text-sm text-muted-foreground">No target selected.</div>
      ) : periodSeries.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">No data for this target in range.</div>
      ) : (
        <div className="p-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b border-input">
                  <th className="py-2 pr-3">{label}</th>
                  <th className="py-2 pr-3">{tab === "muscles" ? "Eff sets" : "Sets"}</th>
                  {tab === "muscles" && <th className="py-2 pr-3">Reps</th>}
                  <th className="py-2 pr-3">Iso sec</th>
                  {tab === "muscles" ? (
                    <th className="py-2">Tonnage</th>
                  ) : (
                    <th className="py-2">Iso load (kg·s)</th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-input">
                {periodSeries.map((p) => (
                  <tr key={p.period_start}>
                    <td className="py-2 pr-3">{p.period_start}</td>
                    <td className="py-2 pr-3">
                      {tab === "muscles"
                        ? formatNumber(Math.round(p.effective_sets * 10) / 10)
                        : formatNumber(p.sets)}
                    </td>

                    {tab === "muscles" && <td className="py-2 pr-3">{formatNumber(p.reps)}</td>}

                    <td className="py-2 pr-3">{formatNumber(p.iso_sec)}</td>

                    {tab === "muscles" ? (
                      <td className="py-2">{formatKg(p.tonnage_kg)}</td>
                    ) : (
                      <td className="py-2">{formatKg(p.iso_load_kg_sec)}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {tab === "muscles" && (
            <div className="mt-3 text-xs text-muted-foreground">
              Notes: muscle “eff sets” are role-weighted (PRIMARY=1, SECONDARY=0.5, STABILIZER=0.25).
            </div>
          )}
        </div>
      )}
    </section>
  );
}

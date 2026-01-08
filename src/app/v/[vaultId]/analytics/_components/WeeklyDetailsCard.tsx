// src/app/v/[vaultId]/analytics/_components/WeeklyDetailsCard.tsx
"use client";

import { formatKg, formatNumber } from "./AnalyticsUtils";



export type WeekAgg = {
  week_start: string;
  sets: number;
  effective_sets: number;
  reps: number;
  iso_sec: number;
  tonnage_kg: number;
  iso_load_kg_sec: number;
  avg_iso_load_kg: number | null;
};

export default function WeeklyDetailsCard(props: {
  tab: Tab;
  weeks: number;
  selectedName?: string;
  selectedId?: string;
  weeksSeries: WeekAgg[];
}) {
  const { tab, weeks, selectedName, selectedId, weeksSeries } = props;

  return (
    <section className="rounded-lg border border-input lg:col-span-2">
      <div className="border-b border-input p-3">
        <div className="text-sm font-medium">{selectedName ?? "Select a target"}</div>
        <div className="mt-1 text-xs text-muted-foreground">Weekly totals across the last {weeks} weeks</div>
      </div>

      {!selectedId ? (
        <div className="p-4 text-sm text-muted-foreground">No target selected.</div>
      ) : weeksSeries.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">No weekly data for this target in range.</div>
      ) : (
        <div className="p-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b border-input">
                  <th className="py-2 pr-3">Week</th>
                  <th className="py-2 pr-3">{tab === "muscles" ? "Eff sets" : "Sets"}</th>
                  <th className="py-2 pr-3">Reps</th>
                  <th className="py-2 pr-3">Iso sec</th>

                  {tab === "tendons" ? (
                    <>
                      <th className="py-2 pr-3">Iso load (kg·s)</th>
                      <th className="py-2">Avg iso kg</th>
                    </>
                  ) : (
                    <th className="py-2">Tonnage</th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-input">
                {weeksSeries.map((w) => (
                  <tr key={w.week_start}>
                    <td className="py-2 pr-3">{w.week_start}</td>
                    <td className="py-2 pr-3">
                      {tab === "muscles"
                        ? formatNumber(Math.round(w.effective_sets * 10) / 10)
                        : formatNumber(w.sets)}
                    </td>
                    <td className="py-2 pr-3">{formatNumber(w.reps)}</td>
                    <td className="py-2 pr-3">{formatNumber(w.iso_sec)}</td>

                    {tab === "tendons" ? (
                      <>
                        <td className="py-2 pr-3">{formatKg(w.iso_load_kg_sec)}</td>
                        <td className="py-2">{w.avg_iso_load_kg == null ? "—" : formatKg(w.avg_iso_load_kg)}</td>
                      </>
                    ) : (
                      <td className="py-2">{formatKg(w.tonnage_kg)}</td>
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

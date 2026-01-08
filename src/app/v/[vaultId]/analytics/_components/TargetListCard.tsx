// src/app/v/[vaultId]/analytics/_components/TargetListCard.tsx
"use client";

import Link from "next/link";
import { formatKg, formatNumber, Tab } from "./AnalyticsUtils";


export type TargetAgg = {
  target_id: string;
  target_name: string;
  sets: number;
  effective_sets: number;
  reps: number;
  iso_sec: number;
  tonnage_kg: number;
  iso_load_kg_sec: number;
  avg_iso_load_kg: number | null;
};

export default function TargetListCard(props: {
  tab: Tab;
  fromISO: string;
  toISO: string;
  q: string;
  sort: string;
  targets: TargetAgg[];
  selectedId?: string;
  rowHref: (id: string) => string;
  sortHref: (s: string) => string;
}) {
  const { tab, fromISO, toISO, q, sort, targets, selectedId, rowHref, sortHref } = props;

  return (
    <section className="rounded-lg border border-input">
      <div className="border-b border-input p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-medium">Targets</div>
          <div className="text-xs text-muted-foreground">
            {fromISO} → {toISO}
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          {/* URL-driven search (current pattern) */}
          <input
            defaultValue={q}
            placeholder="Search… (edit URL q=)"
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none"
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Sort:</span>

          {tab === "muscles" && (
            <Link
              href={sortHref("effective_sets")}
              className={`rounded-md px-2 py-1 ${
                sort === "effective_sets" ? "bg-foreground text-background" : "border border-input"
              }`}
            >
              effective sets
            </Link>
          )}

          <Link
            href={sortHref("sets")}
            className={`rounded-md px-2 py-1 ${sort === "sets" ? "bg-foreground text-background" : "border border-input"}`}
          >
            sets
          </Link>

          <Link
            href={sortHref("reps")}
            className={`rounded-md px-2 py-1 ${sort === "reps" ? "bg-foreground text-background" : "border border-input"}`}
          >
            reps
          </Link>

          <Link
            href={sortHref("iso")}
            className={`rounded-md px-2 py-1 ${sort === "iso" ? "bg-foreground text-background" : "border border-input"}`}
          >
            iso sec
          </Link>

          {tab === "tendons" ? (
            <Link
              href={sortHref("iso_load")}
              className={`rounded-md px-2 py-1 ${
                sort === "iso_load" ? "bg-foreground text-background" : "border border-input"
              }`}
            >
              iso load
            </Link>
          ) : (
            <Link
              href={sortHref("tonnage")}
              className={`rounded-md px-2 py-1 ${
                sort === "tonnage" ? "bg-foreground text-background" : "border border-input"
              }`}
            >
              tonnage
            </Link>
          )}
        </div>
      </div>

      <div className="max-h-[70vh] overflow-auto">
        {targets.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No data in this range.</div>
        ) : (
          <ul className="divide-y divide-input">
            {targets.map((t) => {
              const isActive = t.target_id === selectedId;
              const setsDisplay =
                tab === "muscles"
                  ? formatNumber(Math.round(t.effective_sets * 10) / 10)
                  : formatNumber(t.sets);

              return (
                <li key={t.target_id}>
                  <Link
                    href={rowHref(t.target_id)}
                    className={`block px-3 py-3 hover:bg-muted/40 ${isActive ? "bg-muted/40" : ""}`}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{t.target_name}</div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>{tab === "muscles" ? "eff sets" : "sets"}: {setsDisplay}</span>
                        <span>reps: {formatNumber(t.reps)}</span>
                        <span>iso: {formatNumber(t.iso_sec)}</span>

                        {tab === "tendons" ? (
                          <span>iso load: {formatKg(t.iso_load_kg_sec)} kg·s</span>
                        ) : (
                          <span>ton: {formatKg(t.tonnage_kg)}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EntryRow } from "./types";
import { isSetDone } from "./utils";

type TendonTarget = { targetId: string; targetName: string; confidence: string };

function confidenceWeight(confidence: string) {
  switch ((confidence ?? "").toUpperCase()) {
    case "HIGH":
      return 1.0;
    case "MED":
    case "MEDIUM":
      return 0.67;
    case "LOW":
      return 0.33;
    default:
      return 1.0;
  }
}

export function SessionTendonAnalyticsPanel({
  entries,
  tendonTargetsByExerciseId,
  title = "Tendon effective sets",
}: {
  entries: EntryRow[];
  tendonTargetsByExerciseId: Record<string, TendonTarget[]>;
  title?: string;
}) {
  const [weighted, setWeighted] = React.useState(true);

  const rows = React.useMemo(() => {
    const map = new Map<string, { done: number; planned: number }>();
    let unassignedDone = 0;
    let unassignedPlanned = 0;

    for (const entry of entries) {
      // Tendon panel is isometric-focused (matches your tendon daily/weekly metrics)
      if (entry.exercise.modality !== "ISOMETRIC") continue;

      const plannedSets = entry.sets.length;
      const doneSets = entry.sets.filter((s) => isSetDone("ISOMETRIC", s)).length;

      const targets = tendonTargetsByExerciseId[entry.exercise.id] ?? [];
      if (targets.length === 0) {
        unassignedPlanned += plannedSets;
        unassignedDone += doneSets;
        continue;
      }

      for (const t of targets) {
        const w = weighted ? confidenceWeight(t.confidence) : 1;
        const key = t.targetName;

        const cur = map.get(key) ?? { done: 0, planned: 0 };
        cur.done += doneSets * w;
        cur.planned += plannedSets * w;
        map.set(key, cur);
      }
    }

    const arr = Array.from(map.entries())
      .map(([name, v]) => ({ name, done: v.done, planned: v.planned }))
      .sort((a, b) => b.done - a.done || b.planned - a.planned || a.name.localeCompare(b.name));

    if (unassignedDone || unassignedPlanned) {
      arr.push({ name: "Unassigned", done: unassignedDone, planned: unassignedPlanned });
    }

    return arr;
  }, [entries, tendonTargetsByExerciseId, weighted]);

  const fmt = (n: number) => (weighted ? n.toFixed(1) : String(Math.round(n)));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>

        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={weighted}
            onChange={(e) => setWeighted(e.target.checked)}
          />
          <span>Confidence-weighted (High=1, Med=0.67, Low=0.33)</span>
        </label>
      </CardHeader>

      <CardContent className="pt-0">
        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No tendon targets for this session’s isometric exercises. Assign tendon exposure to exercises to see counts.
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.name} className="flex items-center justify-between text-sm">
                <div className="truncate pr-3">{r.name}</div>
                <div className="tabular-nums">
                  {fmt(r.done)} / {fmt(r.planned)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

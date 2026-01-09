"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EntryRow } from "./types";
import { isSetLogged } from "./utils";

type MuscleTarget = { targetId: string; targetName: string; role: string };

function roleWeight(role: string) {
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

export function SessionMuscleAnalyticsPanel({
  entries,
  muscleTargetsByExerciseId,
  title = "Muscle effective sets",
}: {
  entries: EntryRow[];
  muscleTargetsByExerciseId: Record<string, MuscleTarget[]>;
  title?: string;
}) {
  const [weighted, setWeighted] = React.useState(true);

  const rows = React.useMemo(() => {
    const map = new Map<string, { done: number; planned: number }>();
    let unassignedDone = 0;
    let unassignedPlanned = 0;

    for (const entry of entries) {
      const plannedSets = entry.sets.length;
      const doneSets = entry.sets.filter(isSetLogged).length;

      const targets = muscleTargetsByExerciseId[entry.exercise.id] ?? [];
      if (targets.length === 0) {
        unassignedPlanned += plannedSets;
        unassignedDone += doneSets;
        continue;
      }

      for (const t of targets) {
        const w = weighted ? roleWeight(t.role) : 1;
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
  }, [entries, muscleTargetsByExerciseId, weighted]);

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
          <span>Role-weighted (Primary=1, Secondary=0.5, Stabilizer=0.25)</span>
        </label>
      </CardHeader>

      <CardContent className="pt-0">
        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No targets for this session’s exercises. Assign muscle targets to exercises to see counts.
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

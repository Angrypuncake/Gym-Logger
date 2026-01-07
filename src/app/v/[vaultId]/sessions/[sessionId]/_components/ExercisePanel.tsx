// src/app/v/[vaultId]/sessions/[sessionId]/_components/ExercisesPanel.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { EntryRow, FnForm } from "./types";
import { fmtSetLabel, isSetLogged } from "./utils";

export function ExercisesPanel({
  entries,
  selected,
  onSelect,
  addSetAction,
}: {
  entries: EntryRow[];
  selected: { entryId: string; setId: string } | null;
  onSelect: (entryId: string, setId: string) => void;
  addSetAction?: (entryId: string) => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Exercises</CardTitle>
        <div className="text-sm text-muted-foreground">
          Click a set block to select. Edit on the right.
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {entries.map((entry) => {
          const ex = entry.exercise;
          const total = entry.sets.length;
          const done = entry.sets.filter(isSetLogged).length;

          return (
            <div key={entry.id} className="rounded-lg border border-border bg-muted/10 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-semibold">{ex.name}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{ex.modality}</Badge>
                    {ex.uses_bodyweight && <Badge variant="secondary">BW</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {done}/{total} completed
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                {addSetAction ? (
                    <form action={addSetAction.bind(null, entry.id)} className="contents">
                    <Button type="submit" size="sm" variant="secondary">
                        + Set
                    </Button>
                    </form>
                ) : (
                    <Button size="sm" variant="secondary" disabled>
                    + Set
                    </Button>
                )}

                <Badge variant="secondary">{total} sets</Badge>
                </div>


                
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {entry.sets.map((s) => {
                  const logged = isSetLogged(s);
                  const isSelected = selected?.setId === s.id;
                  const { top, sub } = fmtSetLabel(ex.modality, s);

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onSelect(entry.id, s.id)}
                      className={[
                        "h-11 w-11 rounded-xl border grid place-items-center relative",
                        "transition-transform duration-100 active:scale-95",
                        logged ? "border-emerald-500/40 bg-emerald-500/10" : "border-border bg-background",
                        isSelected ? "ring-2 ring-ring" : "",
                      ].join(" ")}
                      aria-pressed={isSelected}
                      title={`Set ${s.set_index + 1}`}
                    >
                      {top && <div className="text-sm font-semibold">{top}</div>}
                      {sub && (
                        <div className="absolute bottom-1 left-0 right-0 text-[10px] text-muted-foreground">
                          {sub}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {entries.length === 0 && (
          <div className="text-sm text-muted-foreground">No exercises yet. Add one on the right.</div>
        )}
      </CardContent>
    </Card>
  );
}

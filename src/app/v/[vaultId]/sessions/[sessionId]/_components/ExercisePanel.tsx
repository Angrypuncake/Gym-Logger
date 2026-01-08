// src/app/v/[vaultId]/sessions/[sessionId]/_components/ExercisesPanel.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { EntryRow } from "./types";
import { fmtSetLabel, isSetLogged } from "./utils";
import ConfirmSubmitButton from "../ConfirmSubmitButton";

export function ExercisesPanel({
  entries,
  selected,
  onSelect,
  addSetAction,
  removeEntryAction,
  moveEntryUpAction,
  moveEntryDownAction,
  bodyWeightKg,
}: {
  entries: EntryRow[];
  selected: { entryId: string; setId: string } | null;
  onSelect: (entryId: string, setId: string) => void;
  addSetAction?: (entryId: string) => Promise<void>;
  removeEntryAction?: (entryId: string) => Promise<void>;
  moveEntryUpAction?: (entryId: string) => Promise<void>;
  moveEntryDownAction?: (entryId: string) => Promise<void>;
  bodyWeightKg: number | null;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Exercises</CardTitle>
        <div className="text-sm text-muted-foreground">Tap a set block to edit.</div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {entries.map((entry, idx) => {
          const ex = entry.exercise;
          const totalSets = entry.sets.length;
          const done = entry.sets.filter(isSetLogged).length;

          const canMoveUp = idx > 0 && !!moveEntryUpAction;
          const canMoveDown = idx < entries.length - 1 && !!moveEntryDownAction;

          return (
            <div key={entry.id} className="rounded-lg border border-border bg-muted/10 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold">{ex.name}</div>

                    <div className="flex items-center gap-1">
                      {moveEntryUpAction ? (
                        <form action={moveEntryUpAction.bind(null, entry.id)} className="contents">
                          <Button
                            type="submit"
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            disabled={!canMoveUp}
                            title="Move up"
                            aria-label="Move exercise up"
                          >
                            ▲
                          </Button>
                        </form>
                      ) : null}

                      {moveEntryDownAction ? (
                        <form action={moveEntryDownAction.bind(null, entry.id)} className="contents">
                          <Button
                            type="submit"
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            disabled={!canMoveDown}
                            title="Move down"
                            aria-label="Move exercise down"
                          >
                            ▼
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{ex.modality}</Badge>
                    {ex.uses_bodyweight && <Badge variant="secondary">BW</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {done}/{totalSets} completed
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {addSetAction ? (
                    <form action={addSetAction.bind(null, entry.id)} className="contents">
                      <Button type="submit" size="sm" variant="secondary" className="h-9 px-2 sm:px-3">
                        + Set
                      </Button>
                    </form>
                  ) : (
                    <Button size="sm" variant="secondary" disabled className="h-9 px-2 sm:px-3">
                      + Set
                    </Button>
                  )}

                  {removeEntryAction ? (
                    <form action={removeEntryAction.bind(null, entry.id)} className="contents">
                      <ConfirmSubmitButton
                        variant="destructive"
                        size="sm"
                        className="h-9 px-2 sm:px-3"
                        confirmText="Remove this exercise from the session? This deletes the entry and its sets."
                      >
                        <span className="hidden sm:inline">Remove</span>
                        <span className="sm:hidden">Del</span>
                      </ConfirmSubmitButton>
                    </form>
                  ) : null}

                  <Badge variant="secondary" className="hidden sm:inline-flex">
                    {totalSets} sets
                  </Badge>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {entry.sets.map((s) => {
                  const logged = isSetLogged(s);
                  const isSelected = selected?.setId === s.id;

                  // Default label (keeps your existing logic)
                  const base = fmtSetLabel(ex.modality, s, {
                    usesBodyweight: ex.uses_bodyweight,
                    bodyWeightKg,
                  });

                  const top = base.top;
                  let subNode: React.ReactNode = base.sub;

                  // Low-clutter BW display:
                  // - Primary = total system load
                  // - Secondary (small/italic) = external load, only if > 0
                  const usesBW = ex.uses_bodyweight && bodyWeightKg != null;
                  const hasExternal = s.weight_kg != null && s.weight_kg > 0;

                  if (logged && usesBW && ex.modality === "REPS") {
                    const external = s.weight_kg ?? 0;
                    const total = bodyWeightKg! + external;

                    subNode = (
                      <span>
                        {total.toFixed(1)}kg
                        {hasExternal && (
                          <span
                            className="ml-1 text-[10px] italic text-muted-foreground"
                            title={`External: +${external}kg`}
                          >
                            +{external}kg
                          </span>
                        )}
                      </span>
                    );
                  }

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
                      title={`Set ${s.set_index}`}
                    >
                      {top && <div className="text-sm font-semibold">{top}</div>}
                      {subNode && (
                        <div className="absolute bottom-1 left-0 right-0 text-[10px] text-muted-foreground">
                          {subNode}
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
          <div className="text-sm text-muted-foreground">No exercises yet. Add one below.</div>
        )}
      </CardContent>
    </Card>
  );
}

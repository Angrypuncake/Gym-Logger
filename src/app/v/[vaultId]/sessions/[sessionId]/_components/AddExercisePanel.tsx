// src/app/v/[vaultId]/sessions/[sessionId]/_components/AddExercisePanel.tsx
"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ExercisePick, FnForm } from "./types";

export function AddExercisePanel({
  allExercises,
  addExerciseAction,
}: {
  allExercises: ExercisePick[];
  addExerciseAction?: FnForm; // expects: exercise_id
}) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allExercises;
    return allExercises.filter((e) =>
      `${e.name} ${e.modality}`.toLowerCase().includes(q)
    );
  }, [query, allExercises]);

  return (
    <Card>
      <CardContent className="p-3 space-y-3">
        <div className="text-xs font-medium text-muted-foreground">
          Add exercise
        </div>

        {/* Search input */}
        <input
          type="text"
          placeholder="Search exercises…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        {/* Results */}
        <div className="max-h-56 overflow-y-auto space-y-1">
          {filtered.length === 0 && (
            <div className="text-xs text-muted-foreground px-1">
              No matches
            </div>
          )}

          {filtered.map((e) => (
            <form key={e.id} action={addExerciseAction}>
              <input type="hidden" name="exercise_id" value={e.id} />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                disabled={!addExerciseAction}
                className="w-full justify-between text-left"
              >
                <span className="truncate">{e.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {e.modality}
                </span>
              </Button>
            </form>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

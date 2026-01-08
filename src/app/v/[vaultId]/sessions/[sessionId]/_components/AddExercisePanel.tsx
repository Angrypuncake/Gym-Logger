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
  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Add exercise</div>

        <form action={addExerciseAction} className="flex items-center gap-2">
          <select
            name="exercise_id"
            defaultValue=""
            className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={!addExerciseAction}
          >
            <option value="" disabled>
              Select…
            </option>
            {allExercises.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.modality})
              </option>
            ))}
          </select>

          <Button type="submit" size="sm" disabled={!addExerciseAction}>
            Add
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

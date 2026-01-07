// src/app/v/[vaultId]/sessions/[sessionId]/_components/AddExercisePanel.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Add exercise</CardTitle>
        <div className="text-sm text-muted-foreground">Adds planned sets to this session.</div>
      </CardHeader>

      <CardContent className="pt-0">
        <form action={addExerciseAction} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            name="exercise_id"
            defaultValue=""
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

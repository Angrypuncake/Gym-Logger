// src/app/v/[vaultId]/sessions/[sessionId]/_components/SelectedSetPanel.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { EntryRow, FnForm, SetRow } from "./types";
import { isSetLogged, safeNumber } from "./utils";

type SelectedSet = { entry: EntryRow; set: SetRow } | null;

/**
 * Unsetting fix:
 * - Leaving an input blank should NOT clear the stored value.
 * - Blank means "keep existing".
 * - If you ever want explicit “unlog”, make it a separate action/button.
 */
export function SelectedSetPanel({
  selectedSet,
  bodyWeightKg,
  showTotalLoad,
  onClearSelection,
  saveSetAction,
  deleteUnloggedSetAction,
}: {
  selectedSet: SelectedSet;
  bodyWeightKg: number | null;
  showTotalLoad: boolean;
  onClearSelection: () => void;
  saveSetAction?: FnForm; // expects: set_id, reps/weight_kg/duration_sec (blank = keep existing)
  deleteUnloggedSetAction?: FnForm; // expects: set_id (only valid when unlogged)
}) {
  const [weightStr, setWeightStr] = React.useState("");
  const [repsStr, setRepsStr] = React.useState("");
  const [durationStr, setDurationStr] = React.useState("");

  React.useEffect(() => {
    if (!selectedSet) {
      setWeightStr("");
      setRepsStr("");
      setDurationStr("");
      return;
    }
    const { entry, set } = selectedSet;

    if (entry.exercise.modality === "REPS") {
      setWeightStr(set.weight_kg == null ? "" : String(set.weight_kg));
      setRepsStr(set.reps == null ? "" : String(set.reps));
      setDurationStr("");
    } else {
      setDurationStr(set.duration_sec == null ? "" : String(set.duration_sec));
      setWeightStr("");
      setRepsStr("");
    }
  }, [selectedSet]);

  const totalLoad = React.useMemo(() => {
    if (!selectedSet) return null;
    const ex = selectedSet.entry.exercise;
    if (!showTotalLoad) return null;
    if (!ex.uses_bodyweight) return null;
    if (bodyWeightKg == null) return null;

    // For ISOMETRIC, weightStr is "", so external = 0.
    return bodyWeightKg + safeNumber(weightStr);
  }, [selectedSet, showTotalLoad, bodyWeightKg, weightStr]);

  const logged = selectedSet ? isSetLogged(selectedSet.set) : false;
  const canDelete = !!selectedSet && !logged && !!deleteUnloggedSetAction;

  const isReps = selectedSet?.entry.exercise.modality === "REPS";

  const prevSets = React.useMemo(() => {
    if (!selectedSet) return [];
    return selectedSet.entry.sets
      .filter((s) => s.set_index < selectedSet.set.set_index)
      .sort((a, b) => b.set_index - a.set_index); // nearest first
  }, [selectedSet]);

  const lastSetWithWeight = React.useMemo(() => {
    for (const s of prevSets) if (s.weight_kg != null) return s;
    return null;
  }, [prevSets]);

  const lastSetWithReps = React.useMemo(() => {
    for (const s of prevSets) if (s.reps != null) return s;
    return null;
  }, [prevSets]);

  const canPrefill = !!selectedSet && selectedSet.set.set_index > 0;
  const canSameWeight = canPrefill && !!lastSetWithWeight;
  const canSameReps = canPrefill && !!lastSetWithReps;

  function applySameWeight() {
    if (!lastSetWithWeight) return;
    setWeightStr(String(lastSetWithWeight.weight_kg));
  }

  function applySameReps() {
    if (!lastSetWithReps) return;
    setRepsStr(String(lastSetWithReps.reps));
  }

  function clearInputsForUnset() {
    // make submitted values ""
    setWeightStr("");
    setRepsStr("");
    setDurationStr("");
  }


  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Selected set</CardTitle>
        <div className="text-sm text-muted-foreground">
          {selectedSet
            ? `${selectedSet.entry.exercise.name} · Set ${selectedSet.set.set_index + 1}`
            : "Select a set to edit."}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {!selectedSet ? (
          <div className="text-sm text-muted-foreground">Click a set block on the left.</div>
        ) : (
          <form action={saveSetAction} className="space-y-3">
            <input type="hidden" name="set_id" value={selectedSet.set.id} />

            {selectedSet.entry.exercise.modality === "REPS" ? (
  <div className="space-y-2">
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">External (kg)</div>
        <input
          name="weight_kg"
          inputMode="decimal"
          placeholder="(blank = unset)"
          value={weightStr}
          onChange={(e) => setWeightStr(e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">Reps</div>
        <input
          name="reps"
          inputMode="numeric"
          placeholder="(blank = unset)"
          value={repsStr}
          onChange={(e) => setRepsStr(e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>

    {selectedSet.set.set_index > 0 && (
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="justify-center"
          disabled={!canSameWeight}
          onClick={applySameWeight}
        >
          Same weight
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="justify-center"
          disabled={!canSameReps}
          onClick={applySameReps}
        >
          Same reps
        </Button>
      </div>
    )}
  </div>
) : (
  <div className="space-y-1">
    <div className="text-xs text-muted-foreground">Duration (sec)</div>
    <input
      name="duration_sec"
      inputMode="numeric"
      placeholder="(blank = unset)"
      value={durationStr}
      onChange={(e) => setDurationStr(e.target.value)}
      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
  </div>
)}


            {totalLoad != null && (
              <div className="text-sm">
                <span className="text-muted-foreground">Total:</span>{" "}
                <span className="font-medium">{totalLoad.toFixed(1)}kg</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button type="submit" className="flex-1" disabled={!saveSetAction}>
                Save set
              </Button>

              

              <Button
  type="submit"
  variant="secondary"
  disabled={!saveSetAction}
  onClick={() => {
    // blank values to submit => server interprets "" as unset
    setWeightStr("");
    setRepsStr("");
    setDurationStr("");

    // IMPORTANT: don't unmount the form before submit
    // If you want to clear selection, delay it:
    setTimeout(() => onClearSelection(), 0);
  }}
>
  Clear selection
</Button>

              {canDelete && (
                <Button type="submit" variant="destructive" formAction={deleteUnloggedSetAction}>
                  Delete
                </Button>
              )}
            </div>

          </form>
        )}
      </CardContent>
    </Card>
  );
}

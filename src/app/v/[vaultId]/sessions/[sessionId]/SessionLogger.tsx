// src/app/v/[vaultId]/sessions/[sessionId]/SessionLogger.tsx
"use client";

import * as React from "react";
import type { EntryRow, ExercisePick, FnEntryId, FnForm } from "./_components/types";

import { SelectedSetPanel } from "./_components/SelectedSetPanel";
import { AddExercisePanel } from "./_components/AddExercisePanel";
import { ExercisesPanel } from "./_components/ExercisePanel";

export default function SessionLogger({
  entries,
  allExercises,
  bodyWeightKg,
  updateBodyweightAction,
  addExerciseAction,
  addSetAction,
  deleteUnloggedSetAction,
  saveSetAction,
  removeEntryAction,
}: {
  entries: EntryRow[];
  allExercises: ExercisePick[];
  bodyWeightKg: number | null;

  updateBodyweightAction?: FnForm;
  addExerciseAction?: FnForm;
  addSetAction?: FnEntryId;
  deleteUnloggedSetAction?: FnForm;
  saveSetAction?: FnForm; // expects: set_id + fields (blank = keep existing)
  removeEntryAction?: FnEntryId;
}) {
  const [showTotalLoad, setShowTotalLoad] = React.useState(false);
  const [selected, setSelected] = React.useState<{ entryId: string; setId: string } | null>(null);

  React.useEffect(() => {
    if (!selected) return;
    const entry = entries.find((e) => e.id === selected.entryId);
    const set = entry?.sets.find((s) => s.id === selected.setId);
    if (!entry || !set) setSelected(null);
  }, [selected, entries]);

  const selectedSet = React.useMemo(() => {
    if (!selected) return null;
    const entry = entries.find((e) => e.id === selected.entryId);
    const set = entry?.sets.find((s) => s.id === selected.setId);
    if (!entry || !set) return null;
    return { entry, set };
  }, [selected, entries]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_.9fr] items-start">
      <ExercisesPanel
        entries={entries}
        selected={selected}
        onSelect={(entryId, setId) => setSelected({ entryId, setId })}
        addSetAction={addSetAction}
        removeEntryAction={removeEntryAction}
      />

    <div className="self-start lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] overflow-auto">
            <SelectedSetPanel
              selectedSet={selectedSet}
            bodyWeightKg={bodyWeightKg}
              updateBodyweightAction={updateBodyweightAction}
              showTotalLoad={showTotalLoad}
              setShowTotalLoad={setShowTotalLoad}
              onClearSelection={() => setSelected(null)}
              saveSetAction={saveSetAction}
              deleteUnloggedSetAction={deleteUnloggedSetAction}
            />
          </div>

          <div className="lg:col-span-2">
            <AddExercisePanel allExercises={allExercises} addExerciseAction={addExerciseAction} />
          </div>


    </div>
  );
}

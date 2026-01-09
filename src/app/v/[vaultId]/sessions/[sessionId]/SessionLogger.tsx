"use client";

import * as React from "react";
import type { EntryRow, ExercisePick, FnEntryId, FnForm } from "./_components/types";

import { SelectedSetPanel } from "./_components/SelectedSetPanel";
import { AddExercisePanel } from "./_components/AddExercisePanel";
import { ExercisesPanel } from "./_components/ExercisePanel";
import { MobileSetSheet } from "./_components/MobileSetSheet";
import { SessionMuscleAnalyticsPanel } from "./_components/SessionMuscleAnalyticsPanel";


type MuscleTarget = { targetId: string; targetName: string; role: string };

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const m = window.matchMedia(query);
    const onChange = () => setMatches(m.matches);

    onChange();

    // Safari fallback
    if (m.addEventListener) m.addEventListener("change", onChange);
    else m.addListener(onChange);

    return () => {
      if (m.removeEventListener) m.removeEventListener("change", onChange);
      else m.removeListener(onChange);
    };
  }, [query]);

  return matches;
}

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
  moveEntryUpAction,
  moveEntryDownAction,
  muscleTargetsByExerciseId,
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
  moveEntryUpAction?: FnEntryId;
  moveEntryDownAction?: FnEntryId;
  muscleTargetsByExerciseId?: Record<string, MuscleTarget[]>;
}) {

  const [selected, setSelected] = React.useState<{ entryId: string; setId: string } | null>(null);

  const isMobile = useMediaQuery("(max-width: 1023px)"); // < lg

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

  const mobileEditorOpen = isMobile && !!selectedSet;
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_.9fr] items-start">
      <ExercisesPanel
        entries={entries}
        selected={selected}
        onSelect={(entryId, setId) => setSelected({ entryId, setId })}
        addSetAction={addSetAction}
        removeEntryAction={removeEntryAction}
        bodyWeightKg={bodyWeightKg} // add (for set-block totals)
        moveEntryUpAction={moveEntryUpAction}
        moveEntryDownAction={moveEntryDownAction}
      />
      {/* Mobile: collapsible analytics */}
      <div className="lg:hidden">
        <details className="rounded-md border border-border bg-muted/5 px-3 py-2">
          <summary className="cursor-pointer select-none text-sm font-medium">Muscle sets</summary>
          <div className="mt-3">
            <SessionMuscleAnalyticsPanel
              entries={entries}
              muscleTargetsByExerciseId={muscleTargetsByExerciseId ?? {}}
            />
          </div>
        </details>
      </div>

      <div className="hidden lg:block self-start lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] overflow-auto">
        <SelectedSetPanel
          selectedSet={selectedSet}
          bodyWeightKg={bodyWeightKg}
          updateBodyweightAction={updateBodyweightAction}
          onClearSelection={() => setSelected(null)}
          saveSetAction={saveSetAction}
          deleteUnloggedSetAction={deleteUnloggedSetAction}
        />
        <div className="space-y-4">
          <SessionMuscleAnalyticsPanel
            entries={entries}
            muscleTargetsByExerciseId={muscleTargetsByExerciseId ?? {}}
          />
          <SelectedSetPanel
            selectedSet={selectedSet}
            bodyWeightKg={bodyWeightKg}
            updateBodyweightAction={updateBodyweightAction}
            onClearSelection={() => setSelected(null)}
            saveSetAction={saveSetAction}
           deleteUnloggedSetAction={deleteUnloggedSetAction}
          />
        </div>
      </div>

      <div className="lg:col-span-2">
        <AddExercisePanel allExercises={allExercises} addExerciseAction={addExerciseAction} />
      </div>

      <MobileSetSheet open={mobileEditorOpen} onClose={() => setSelected(null)}>
        <SelectedSetPanel
          selectedSet={selectedSet}
          bodyWeightKg={bodyWeightKg}
          updateBodyweightAction={updateBodyweightAction}
          onClearSelection={() => setSelected(null)}
          saveSetAction={saveSetAction}
          deleteUnloggedSetAction={deleteUnloggedSetAction}
        />
      </MobileSetSheet>
    </div>
  );
}
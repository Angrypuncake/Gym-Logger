"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Modality = "REPS" | "ISOMETRIC";

type SetRow = {
  id: string;
  entry_id: string;
  set_index: number;
  reps: number | null;
  weight_kg: number | null;
  duration_sec: number | null;
};

type EntryRow = {
  id: string;
  order: number;
  exercise: { id: string; name: string; modality: Modality; uses_bodyweight: boolean };
  sets: SetRow[];
};

type ExercisePick = { id: string; name: string; modality: Modality };

type FnForm = (formData: FormData) => void | Promise<void>;

function isSetLogged(s: SetRow) {
  return s.reps !== null || s.weight_kg !== null || s.duration_sec !== null;
}

function fmtSetLabel(modality: Modality, s: SetRow) {
  if (!isSetLogged(s)) return { top: null as string | null, sub: null as string | null };

  if (modality === "REPS") {
    const top = s.reps != null ? String(s.reps) : "✓";
    const sub = s.weight_kg != null ? `${s.weight_kg}kg` : null;
    return { top, sub };
  }

  const top = s.duration_sec != null ? String(s.duration_sec) : "✓";
  return { top, sub: "s" };
}

function safeNumber(input: string) {
  const n = Number(input);
  return Number.isFinite(n) ? n : 0;
}

function ExercisesPanel({
  entries,
  selected,
  onSelect,
  addSetAction,
}: {
  entries: EntryRow[];
  selected: { entryId: string; setId: string } | null;
  onSelect: (entryId: string, setId: string) => void;
  addSetAction?: FnForm; // expects: entry_id
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
                  <form action={addSetAction} className="contents">
                    <input type="hidden" name="entry_id" value={entry.id} />
                    <Button type="submit" size="sm" variant="secondary" disabled={!addSetAction}>
                      + Set
                    </Button>
                  </form>
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

function SelectedSetPanel({
  selectedSet,
  bodyWeightKg,
  showTotalLoad,
  onClearSelection,
  saveSetAction,
  deleteUnloggedSetAction,
}: {
  selectedSet: { entry: EntryRow; set: SetRow } | null;
  bodyWeightKg: number | null;
  showTotalLoad: boolean;
  onClearSelection: () => void;
  saveSetAction?: FnForm; // expects: set_id, reps/weight_kg/duration_sec (blank clears)
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

    // For ISOMETRIC, weightStr is "", so external = 0
    return bodyWeightKg + safeNumber(weightStr);
  }, [selectedSet, showTotalLoad, bodyWeightKg, weightStr]);

  const logged = selectedSet ? isSetLogged(selectedSet.set) : false;
  const canDelete = !!selectedSet && !logged && !!deleteUnloggedSetAction;

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
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">External (kg)</div>
                  <input
                    name="weight_kg"
                    inputMode="decimal"
                    placeholder="e.g., 10"
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
                    placeholder="e.g., 8"
                    value={repsStr}
                    onChange={(e) => setRepsStr(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Duration (sec)</div>
                <input
                  name="duration_sec"
                  inputMode="numeric"
                  placeholder="e.g., 30"
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

              <Button type="button" variant="secondary" onClick={onClearSelection}>
                Clear
              </Button>

              {canDelete && (
                <Button type="submit" variant="destructive" formAction={deleteUnloggedSetAction}>
                  Delete
                </Button>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              Blank fields and save to clear a set. Only unlogged sets can be deleted.
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function SessionMetaPanel({
  bodyWeightKg,
  updateBodyweightAction,
  showTotalLoad,
  setShowTotalLoad,
}: {
  bodyWeightKg: number | null;
  updateBodyweightAction?: FnForm; // expects: body_weight_kg
  showTotalLoad: boolean;
  setShowTotalLoad: (v: boolean) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Session</CardTitle>
        <div className="text-sm text-muted-foreground">
          Bodyweight is used only for exercises marked as BW in the Exercise editor.
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <form action={updateBodyweightAction} className="flex items-center gap-2">
          <input
            name="body_weight_kg"
            inputMode="decimal"
            placeholder="Bodyweight (kg)"
            defaultValue={bodyWeightKg ?? ""}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={!updateBodyweightAction}
          />
          <Button type="submit" variant="secondary" size="sm" disabled={!updateBodyweightAction}>
            Save
          </Button>
        </form>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={showTotalLoad}
            onChange={(e) => setShowTotalLoad(e.target.checked)}
          />
          <span>Show total load (BW + external) for BW exercises</span>
        </label>

        <div className="text-xs text-muted-foreground">
          Default: OFF. Set blocks still show external load; totals are informational.
        </div>
      </CardContent>
    </Card>
  );
}

function AddExercisePanel({
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

export default function SessionLogger({
  entries,
  allExercises,
  bodyWeightKg,
  updateBodyweightAction,
  addExerciseAction,
  addSetAction,
  deleteUnloggedSetAction,
  saveSetAction,
}: {
  entries: EntryRow[];
  allExercises: ExercisePick[];
  bodyWeightKg: number | null;

  // All workouts are mutable; buttons are only disabled if an action is not provided.
  updateBodyweightAction?: FnForm;
  addExerciseAction?: FnForm;
  addSetAction?: FnForm; // expects: entry_id
  deleteUnloggedSetAction?: FnForm; // expects: set_id
  saveSetAction?: FnForm; // expects: set_id + fields
}) {
  const [showTotalLoad, setShowTotalLoad] = React.useState(false);
  const [selected, setSelected] = React.useState<{ entryId: string; setId: string } | null>(null);

  // If selection points to an entry/set that no longer exists, clear it.
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
    <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr_.8fr] items-start">
      <ExercisesPanel
        entries={entries}
        selected={selected}
        onSelect={(entryId, setId) => setSelected({ entryId, setId })}
        addSetAction={addSetAction}
      />

      <SelectedSetPanel
        selectedSet={selectedSet}
        bodyWeightKg={bodyWeightKg}
        showTotalLoad={showTotalLoad}
        onClearSelection={() => setSelected(null)}
        saveSetAction={saveSetAction}
        deleteUnloggedSetAction={deleteUnloggedSetAction}
      />

      <div className="space-y-4">
        <SessionMetaPanel
          bodyWeightKg={bodyWeightKg}
          updateBodyweightAction={updateBodyweightAction}
          showTotalLoad={showTotalLoad}
          setShowTotalLoad={setShowTotalLoad}
        />

        <AddExercisePanel allExercises={allExercises} addExerciseAction={addExerciseAction} />
      </div>
    </div>
  );
}

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { removeExercise, updateExerciseAction, updateExerciseTargetsAction } from "./actions";
import { listAnatomicalTargets, listExerciseTargets } from "@/db/anatomy";
import { MuscleRoleBoard } from "./MuscleRoleBoard";
import ExerciseTendonBadges from "./ExerciseTendonBadges";

type Exercise = {
  id: string;
  name: string;
  modality: "REPS" | "ISOMETRIC";
  uses_bodyweight: boolean;
};

export async function ExerciseEditorPanel({
  vaultId,
  exercise,
}: {
  vaultId: string;
  exercise: Exercise | null;
}) {

  if (!exercise) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Edit exercise</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-sm text-muted-foreground">
          Select an exercise from the list to edit.
        </CardContent>
      </Card>
    );
  }

  const muscleGroups = await listAnatomicalTargets({ kind: "MUSCLE_GROUP" });

  const existing = await listExerciseTargets(exercise.id);
  console.log(existing)

  const initialSelected = Object.fromEntries(existing.map((x) => [x.target.id, x.role]));

  return (
    <Card>

<CardContent className="pt-0 space-y-4">
  {/* Exercise details */}
  <form action={updateExerciseAction.bind(null, vaultId, exercise.id)} className="space-y-4">
    <div className="space-y-2">
      <label className="text-sm font-medium">Name</label>
      <input
        name="name"
        defaultValue={exercise.name}
        required
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>

    {/* Optional: keep if you want modality editable here; otherwise remove */}
    <div className="space-y-2">
      <label className="text-sm font-medium">Modality</label>
      <select
        name="modality"
        defaultValue={exercise.modality}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="REPS">REPS</option>
        <option value="ISOMETRIC">ISOMETRIC</option>
      </select>
    </div>

    <div className="flex items-center gap-2">
      <input
        id="uses_bodyweight"
        type="checkbox"
        name="uses_bodyweight"
        defaultChecked={exercise.uses_bodyweight}
      />
      <label htmlFor="uses_bodyweight" className="text-sm">
        Uses bodyweight
      </label>
    </div>

    <Button type="submit" size="sm" className="active:scale-95 transition-transform">
      Save details
    </Button>
  </form>

  <Separator />


</CardContent>
      <CardContent className="pt-0 space-y-4">

        <Separator />

        <form
          action={updateExerciseTargetsAction.bind(null, vaultId, exercise.id)}
          className="space-y-3"
        >
          <div className="text-sm font-medium">Muscle groups</div>

          {muscleGroups.length === 0 ? (
            <div className="text-sm text-muted-foreground">No muscle groups seeded yet.</div>
          ) : (
            <MuscleRoleBoard
              targets={muscleGroups.map((g) => ({ id: g.id, name: g.name }))}
              initialSelected={initialSelected as Record<string, "PRIMARY" | "SECONDARY" | "STABILIZER">}
            />
            
          )}
          

          <Button type="submit" size="sm" className="active:scale-95 transition-transform">
            Save muscle groups
          </Button>
        </form>

        <Separator />

        <Separator />

<ExerciseTendonBadges exerciseId={exercise.id} />

<Separator />

        <form action={removeExercise.bind(null, vaultId, exercise.id)}>
          <Button type="submit" variant="destructive" className="active:scale-95 transition-transform">
            Delete exercise
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

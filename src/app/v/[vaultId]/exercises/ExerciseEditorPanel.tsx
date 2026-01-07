import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { removeExercise, updateExerciseAction, updateExerciseTargetsAction } from "./actions";
import { listAnatomicalTargets, listExerciseTargets } from "@/db/anatomy";
import { MuscleRoleBoard } from "./MuscleRoleBoard";

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
  const clearHref = `/v/${vaultId}/exercises`;

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

  // FIX: include exercise.id
  const existing = await listExerciseTargets(exercise.id);
  console.log(existing)

  const initialSelected = Object.fromEntries(existing.map((x) => [x.target.id, x.role]));

  return (
    <Card>
      <CardHeader className="pb-3 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm">Edit exercise</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href={clearHref}>Close</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold">{exercise.name}</div>
          <Badge variant="outline">{exercise.modality}</Badge>
          {exercise.uses_bodyweight ? <Badge variant="secondary">Bodyweight</Badge> : null}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        <form action={updateExerciseAction.bind(null, vaultId, exercise.id)} className="space-y-4">
          {/* unchanged */}
          ...
        </form>

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

        <form action={removeExercise.bind(null, vaultId, exercise.id)}>
          <Button type="submit" variant="destructive" className="active:scale-95 transition-transform">
            Delete exercise
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

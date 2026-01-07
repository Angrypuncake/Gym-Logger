import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { removeExercise, updateExerciseAction } from "./actions";

type Exercise = {
  id: string;
  name: string;
  modality: "REPS" | "ISOMETRIC";
  uses_bodyweight: boolean;
};

export function ExerciseEditorPanel({
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
        <form
          action={updateExerciseAction.bind(null, vaultId, exercise.id)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <input
              name="name"
              defaultValue={exercise.name}
              required
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

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

          <div className="flex items-center gap-2">
            <Button type="submit" className="active:scale-95 transition-transform">
              Save
            </Button>
            <Button asChild type="button" variant="secondary">
              <Link href={clearHref}>Done</Link>
            </Button>
          </div>
        </form>

        <Separator />

        <form action={removeExercise.bind(null, vaultId, exercise.id)}>
          <Button
            type="submit"
            variant="destructive"
            className="active:scale-95 transition-transform"
          >
            Delete exercise
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

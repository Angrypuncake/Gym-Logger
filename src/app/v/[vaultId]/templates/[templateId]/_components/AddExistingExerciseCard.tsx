// templates/[templateId]/_components/AddExistingExerciseCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExercisePicker } from "../../../exercises/ExercisePicker";

export function AddExistingExerciseCard({
  availableExercises,
  onAddExisting,
}: {
  availableExercises: { id: string; name: string; modality: "REPS" | "ISOMETRIC";}[];
  onAddExisting: (formData: FormData) => void | Promise<void>;
}) {
  const disabled = availableExercises.length === 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Add existing exercise</CardTitle>
        <div className="text-sm text-muted-foreground">Add an unused exercise from your vault to this template.</div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <form action={onAddExisting} className="space-y-3">
          <ExercisePicker
            exercises={availableExercises}
            disabled={disabled}
            emptyText="No matches. Try a different search."
            listHeightClassName="h-56"
          />

          <Button type="submit" size="sm" disabled={disabled} className="active:scale-95 transition-transform">
            Add
          </Button>
        </form>

        {disabled && <div className="text-sm text-muted-foreground">No unused exercises available. Create a new one below.</div>}
      </CardContent>
    </Card>
  );
}

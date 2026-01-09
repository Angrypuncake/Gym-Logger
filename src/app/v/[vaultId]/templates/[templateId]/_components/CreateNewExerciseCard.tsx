// templates/[templateId]/_components/CreateNewExerciseCard.tsx
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function CreateNewExerciseCard({
  vaultId,
  onCreateAndAdd,
}: {
  vaultId: string;
  onCreateAndAdd: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Create new exercise</CardTitle>
        <div className="text-sm text-muted-foreground">
          Create an exercise and immediately add it to this template.
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        <form action={onCreateAndAdd} className="flex flex-col gap-2">
          <input
            name="name"
            placeholder="Exercise name"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              name="modality"
              defaultValue="REPS"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="REPS">REPS</option>
              <option value="ISOMETRIC">ISOMETRIC</option>
            </select>

            <Button type="submit" size="sm" className="active:scale-95 transition-transform">
              Create + Add
            </Button>
          </div>
        </form>

        <Separator />

        <Button asChild type="button" size="sm" variant="secondary" className="w-full">
          <Link href={`/v/${vaultId}/exercises`}>Manage exercises</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

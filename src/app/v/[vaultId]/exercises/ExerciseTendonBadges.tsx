// src/app/v/[vaultId]/exercises/ExerciseTendonBadges.tsx
import { Badge } from "@/components/ui/badge";
import { listExerciseTendons } from "@/db/anatomy";

export default async function ExerciseTendonBadges({
  exerciseId,
}: {
  exerciseId: string;
}) {
  const tendons = await listExerciseTendons(exerciseId);

  if (tendons.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No tendon focus tags (system curated).
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Tendon focus</div>
      <div className="flex flex-wrap gap-2">
        {tendons.map((t) => (
          <Badge key={t.id} variant="outline">
            {t.name}
          </Badge>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        Read-only. Tendon focus is inferred from a curated mapping.
      </div>
    </div>
  );
}

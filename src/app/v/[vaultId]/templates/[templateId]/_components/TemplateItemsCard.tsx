// templates/[templateId]/_components/TemplateItemsCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TemplateItemRow } from "./TemplateItemRow";

type ItemRow = {
  id: string;
  sort_order: number;
  target_sets: number | null;
  exercise_id: string;
  exercise: { id: string; name: string; modality: "REPS" | "ISOMETRIC" } | null;
};

export function TemplateItemsCard({
  vaultId,
  items,
  binders,
}: {
  vaultId: string;
  items: ItemRow[];
  binders: {
    moveUp: (itemId: string) => (formData: FormData) => void | Promise<void>;
    moveDown: (itemId: string) => (formData: FormData) => void | Promise<void>;
    remove: (itemId: string) => (formData: FormData) => void | Promise<void>;
    setTargetSets: (itemId: string) => (formData: FormData) => void | Promise<void>;
  };
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Exercises</CardTitle>
        <div className="text-sm text-muted-foreground">
          Define default set count per exercise. Template edits apply to future sessions.
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {items.map((it, idx) => (
            <TemplateItemRow
              key={it.id}
              item={it}
              index={idx}
              isFirst={idx === 0}
              isLast={idx === items.length - 1}
              vaultId={vaultId}
              onMoveUp={binders.moveUp(it.id)}
              onMoveDown={binders.moveDown(it.id)}
              onRemove={binders.remove(it.id)}
              onSetTargetSets={binders.setTargetSets(it.id)}
            />
          ))}

          {items.length === 0 && (
            <div className="text-sm text-muted-foreground">No exercises yet. Add one on the right.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

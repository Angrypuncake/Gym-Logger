// templates/[templateId]/_components/TemplateItemRow.tsx
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import SetBlocksControl from "../SetBlocksControl";

type ItemRow = {
  id: string;
  sort_order: number;
  target_sets: number | null;
  exercise_id: string;
  exercise: { id: string; name: string; modality: "REPS" | "ISOMETRIC" } | null;
};

export function TemplateItemRow({
  item,
  index,
  isFirst,
  isLast,
  vaultId,
  onMoveUp,
  onMoveDown,
  onRemove,
  onSetTargetSets,
}: {
  item: ItemRow;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  vaultId: string;
  onMoveUp: (formData: FormData) => void | Promise<void>;
  onMoveDown: (formData: FormData) => void | Promise<void>;
  onRemove: (formData: FormData) => void | Promise<void>;
  onSetTargetSets: (formData: FormData) => void | Promise<void>;
}) {
  const ex = item.exercise;

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-medium">
              {index + 1}. {ex?.name ?? "Unknown exercise"}
            </div>
            {ex?.modality ? <Badge variant="outline">{ex.modality}</Badge> : <Badge variant="destructive">Missing</Badge>}
          </div>
          <div className="text-xs text-muted-foreground">Item order: {item.sort_order}</div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <form action={onMoveUp}>
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              disabled={isFirst}
              className="active:scale-95 transition-transform"
            >
              Up
            </Button>
          </form>

          <form action={onMoveDown}>
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              disabled={isLast}
              className="active:scale-95 transition-transform"
            >
              Down
            </Button>
          </form>

          <Link href={`/v/${vaultId}/exercises?edit=${item.exercise_id}`} scroll={false}>
            <Button size="sm" variant="secondary">
              Edit
            </Button>
          </Link>

          <form action={onRemove}>
            <Button type="submit" size="sm" variant="destructive" className="active:scale-95 transition-transform">
              Remove
            </Button>
          </form>
        </div>
      </div>

      <Separator className="my-3" />

      <SetBlocksControl initialTargetSets={item.target_sets} action={onSetTargetSets} />
    </div>
  );
}

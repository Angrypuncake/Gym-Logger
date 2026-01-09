// templates/[templateId]/page.tsx (refactored)
import Link from "next/link";
import { Button } from "@/components/ui/button";

import {
  addExistingExercise,
  createExerciseAndAdd,
  moveItem,
  removeTemplateItem,
  renameTemplate,
  setTargetSets,
} from "./actions";

import { getTemplateEditorData } from "@/db/templates/index";

import { TemplateEditorHeader } from "./_components/TemplateEditorHeader";
import { TemplateDetailsCard } from "./_components/TemplateDetailsCard";
import { TemplateItemsCard } from "./_components/TemplateItemsCard";
import { AddExistingExerciseCard } from "./_components/AddExistingExerciseCard";
import { CreateNewExerciseCard } from "./_components/CreateNewExerciseCard";

type ItemRow = {
  id: string;
  sort_order: number;
  target_sets: number | null;
  exercise_id: string;
  exercise: { id: string; name: string; modality: "REPS" | "ISOMETRIC" } | null;
};

export default async function TemplateEditorPage({
  params,
}: {
  params: Promise<{ vaultId: string; templateId: string }>;
}) {
  const { vaultId, templateId } = await params;

  const { template, items, exercises } = await getTemplateEditorData(vaultId, templateId);

  const itemRows = (items as unknown as ItemRow[]) ?? [];
  const used = new Set(itemRows.map((it) => it.exercise_id).filter(Boolean));
  const availableExercises = (exercises ?? []).filter((e) => !used.has(e.id));

  const binders = {
    moveUp: (itemId: string) => moveItem.bind(null, vaultId, templateId, itemId, "up"),
    moveDown: (itemId: string) => moveItem.bind(null, vaultId, templateId, itemId, "down"),
    remove: (itemId: string) => removeTemplateItem.bind(null, vaultId, templateId, itemId),
    setTargetSets: (itemId: string) => setTargetSets.bind(null, vaultId, templateId, itemId),
  };

  return (
    <div className="mx-auto max-w-[920px] px-4 py-6 space-y-6">
      <TemplateEditorHeader vaultId={vaultId} templateName={template.name} />

      <TemplateDetailsCard
        templateName={template.name}
        onRename={renameTemplate.bind(null, vaultId, templateId)}
      />

      <div className="grid gap-4 md:grid-cols-[1.2fr_.8fr]">
        <TemplateItemsCard vaultId={vaultId} items={itemRows} binders={binders} />

        <div className="space-y-4">
          <AddExistingExerciseCard
            availableExercises={availableExercises}
            onAddExisting={addExistingExercise.bind(null, vaultId, templateId)}
          />

          <CreateNewExerciseCard
            vaultId={vaultId}
            onCreateAndAdd={createExerciseAndAdd.bind(null, vaultId, templateId)}
          />

          <Button asChild type="button" variant="secondary" className="w-full">
            <Link href={`/v/${vaultId}`}>Done</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

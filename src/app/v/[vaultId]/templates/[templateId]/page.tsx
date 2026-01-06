import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  addExistingExercise,
  createExerciseAndAdd,
  moveItem,
  removeTemplateItem,
  renameTemplate,
  setTargetSets,
} from "./actions";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import SetBlocksControl from "./SetBlocksControl";

type ItemRow = {
  id: string;
  order: number;
  target_sets: number | null;
  exercise: { id: string; name: string; modality: "REPS" | "ISOMETRIC" };
};

export default async function TemplateEditorPage({
  params,
}: {
  params: Promise<{ vaultId: string; templateId: string }>;
}) {
  const { vaultId, templateId } = await params;
  const supabase = await createClient();

  const { data: template, error: tErr } = await supabase
    .from("templates")
    .select("id,name,order")
    .eq("vault_id", vaultId)
    .eq("id", templateId)
    .single();

  if (tErr) return <pre>{tErr.message}</pre>;

  const { data: items, error: iErr } = await supabase
    .from("template_items")
    .select("id,order,target_sets, exercise:exercises(id,name,modality)")
    .eq("vault_id", vaultId)
    .eq("template_id", templateId)
    .order("order", { ascending: true });

  if (iErr) return <pre>{iErr.message}</pre>;

  const { data: exercises } = await supabase
    .from("exercises")
    .select("id,name,modality")
    .eq("vault_id", vaultId)
    .order("name", { ascending: true });

  const used = new Set((items ?? []).map((it) => (it.exercise as any)?.id).filter(Boolean));
  const availableExercises = (exercises ?? []).filter((e) => !used.has(e.id));

  return (
    <div className="mx-auto max-w-[920px] px-4 py-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href={`/v/${vaultId}`}>← Back</Link>
            </Button>
            <h1 className="text-sm font-semibold">
              Template editor: <span className="font-semibold">{template.name}</span>
            </h1>
          </div>
          <div className="text-xs text-muted-foreground">Vault: {vaultId}</div>
        </div>

        <Button asChild variant="ghost" size="sm">
          <Link href={`/v/${vaultId}`}>Done</Link>
        </Button>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Template details</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <form
            action={renameTemplate.bind(null, vaultId, templateId)}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <input
              name="name"
              defaultValue={template.name}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" size="sm">
              Rename
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-[1.2fr_.8fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Exercises</CardTitle>
            <div className="text-sm text-muted-foreground">
              Define default set count per exercise. Template edits apply to future sessions.
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="space-y-3">
              {(items as unknown as ItemRow[]).map((it, idx) => (
                <div key={it.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-medium">
                          {idx + 1}. {it.exercise.name}
                        </div>
                        <Badge variant="outline">{it.exercise.modality}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Item order: {it.order}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <form action={moveItem.bind(null, vaultId, templateId, it.id, "up")}>
                        <Button type="submit" size="sm" variant="secondary" disabled={idx === 0}>
                          Up
                        </Button>
                      </form>

                      <form action={moveItem.bind(null, vaultId, templateId, it.id, "down")}>
                        <Button
                          type="submit"
                          size="sm"
                          variant="secondary"
                          disabled={idx === (items?.length ?? 1) - 1}
                        >
                          Down
                        </Button>
                      </form>

                      <form action={removeTemplateItem.bind(null, vaultId, templateId, it.id)}>
                        <Button type="submit" size="sm" variant="destructive">
                          Remove
                        </Button>
                      </form>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <SetBlocksControl
  initialTargetSets={it.target_sets}
  action={setTargetSets.bind(null, vaultId,  templateId, it.id)}
/>
                </div>
              ))}

              {(items?.length ?? 0) === 0 && (
                <div className="text-sm text-muted-foreground">
                  No exercises yet. Add one on the right.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Add existing exercise</CardTitle>
              <div className="text-sm text-muted-foreground">
                Add an unused exercise from your vault to this template.
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <form
                action={addExistingExercise.bind(null, vaultId, templateId)}
                className="flex flex-col gap-2 sm:flex-row sm:items-center"
              >
                <select
                  name="exercise_id"
                  defaultValue=""
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {availableExercises.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.modality})
                    </option>
                  ))}
                </select>

                <Button type="submit" size="sm" disabled={availableExercises.length === 0}>
                  Add
                </Button>
              </form>

              {availableExercises.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No unused exercises available. Create a new one below.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Create new exercise</CardTitle>
              <div className="text-sm text-muted-foreground">
                Create an exercise and immediately add it to this template.
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <form
                action={createExerciseAndAdd.bind(null, vaultId, templateId)}
                className="flex flex-col gap-2"
              >
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

                  <Button type="submit" size="sm">
                    Create + Add
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Button asChild variant="secondary" className="w-full">
            <Link href={`/v/${vaultId}`}>Done</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

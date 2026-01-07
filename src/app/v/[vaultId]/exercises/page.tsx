// src/app/v/[vaultId]/exercises/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";

import { listExercises } from "@/db/exercises";
import { listPrimaryMuscleGroupsForExercises } from "@/db/anatomy";
import {
  addExercise,
  archiveExerciseAction,
  unarchiveExerciseAction,
  removeExercise,
} from "./actions";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExerciseEditorPanel } from "./ExerciseEditorPanel";

export const dynamic = "force-dynamic";

type SearchParams = {
  edit?: string;
  archived?: string; // "1" to show archived in list
};

function buildExercisesHref(vaultId: string, params: { edit?: string; archived?: string }) {
  const sp = new URLSearchParams();
  if (params.edit) sp.set("edit", params.edit);
  if (params.archived) sp.set("archived", params.archived);
  const qs = sp.toString();
  return `/v/${vaultId}/exercises${qs ? `?${qs}` : ""}`;
}

export default async function ExercisesPage({
  params,
  searchParams,
}: {
  params: Promise<{ vaultId: string }>;
  searchParams?: Promise<SearchParams>;
}) {
  const { vaultId } = await params;
  const sp = searchParams ? await searchParams : undefined;

  if (!vaultId || vaultId === "undefined") redirect(`/`);

  const allExercises = await listExercises(vaultId);

  const showArchived = sp?.archived === "1";
  const exercises = showArchived ? allExercises : allExercises.filter((e: any) => !e.archived_at);

  const primaryByExerciseId = await listPrimaryMuscleGroupsForExercises(
    vaultId,
    exercises.map((e) => e.id)
  );

  const editId = sp?.edit;
  const selected = editId ? (allExercises.find((e) => e.id === editId) ?? null) : null;
  const selectedIsArchived = Boolean((selected as any)?.archived_at);

  const toggleArchivedHref = buildExercisesHref(vaultId, {
    edit: editId,
    archived: showArchived ? undefined : "1",
  });

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Button asChild variant="secondary" size="sm">
            <Link href={`/v/${vaultId}`}>← Back</Link>
          </Button>
          <h1 className="text-sm font-semibold">Exercises</h1>
          <div className="text-xs text-muted-foreground">Vault: {vaultId}</div>
        </div>

        <Button asChild variant="ghost" size="sm">
          <Link href={`/v/${vaultId}`}>Done</Link>
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* Left: manager */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Create exercise</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <form action={addExercise.bind(null, vaultId)} className="flex flex-col gap-2">
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
                    Add
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm">Your exercises</CardTitle>

                <Button asChild size="sm" variant="ghost">
                  <Link href={toggleArchivedHref} scroll={false}>
                    {showArchived ? "Showing archived" : "Show archived"}
                  </Link>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="divide-y">
                {exercises.map((e: any) => {
                  const isSelected = e.id === editId;
                  const primary = primaryByExerciseId.get(e.id);
                  const isArchived = Boolean(e.archived_at);

                  const rowHref = buildExercisesHref(vaultId, {
                    edit: e.id,
                    archived: showArchived ? "1" : undefined,
                  });

                  return (
                    <div
                      key={e.id}
                      className={`py-4 flex items-start justify-between gap-4 ${
                        isSelected ? "bg-muted/40" : ""
                      }`}
                    >
                      <Link
                        href={rowHref}
                        scroll={false}
                        className="flex-1 space-y-1 px-2 -mx-2 rounded-md hover:bg-muted/40"
                      >
                        <div className="text-sm font-medium flex items-center gap-2">
                          <span>{e.name}</span>
                          {isArchived ? <Badge variant="outline">Archived</Badge> : null}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">{e.modality}</Badge>
                          {primary ? <Badge variant="secondary">{primary}</Badge> : null}
                          {e.uses_bodyweight ? <Badge variant="secondary">Bodyweight</Badge> : null}
                        </div>
                      </Link>

                      <div className="flex items-center gap-2">
                        {isArchived ? (
                          <>
                            <form action={unarchiveExerciseAction.bind(null, vaultId, e.id)}>
                              <Button size="sm" type="submit" variant="secondary">
                                Unarchive
                              </Button>
                            </form>

                            <form action={removeExercise.bind(null, vaultId, e.id)}>
                              <Button size="sm" type="submit" variant="destructive">
                                Delete
                              </Button>
                            </form>
                          </>
                        ) : (
                          <form action={archiveExerciseAction.bind(null, vaultId, e.id)}>
                            <Button size="sm" type="submit" variant="secondary">
                              Archive
                            </Button>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                })}

                {exercises.length === 0 && (
                  <div className="py-6 text-sm text-muted-foreground">
                    {showArchived ? "No exercises." : "No active exercises. Create one above."}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: preallocated editor space */}
        <div className="lg:sticky lg:top-6 h-fit">
          {selectedIsArchived ? (
            <div className="mb-2 text-xs text-muted-foreground">
              Editing an archived exercise. Unarchive to use it in new workouts/templates.
            </div>
          ) : null}

          <ExerciseEditorPanel key={selected?.id ?? "none"} vaultId={vaultId} exercise={selected} />
        </div>
      </div>
    </div>
  );
}

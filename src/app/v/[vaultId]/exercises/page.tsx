import Link from "next/link";
import { redirect } from "next/navigation";

import { listExercises } from "@/db/exercises";
import { addExercise, removeExercise } from "./actions";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExerciseEditorPanel } from "./ExerciseEditorPanel";


export default async function ExercisesPage({
  params,
  searchParams,
}: {
  params: Promise<{ vaultId: string }>;
  searchParams?: Promise<{ edit?: string }>;
}) {
  const { vaultId } = await params;
  const sp = searchParams ? await searchParams : undefined;

  if (!vaultId || vaultId === "undefined") redirect(`/`);

  const exercises = await listExercises(vaultId);

  const editId = sp?.edit;
  const selected = editId ? exercises.find((e) => e.id === editId) ?? null : null;

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
              <CardTitle className="text-sm">Your exercises</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y">
                {exercises.map((e) => {
                  const isSelected = e.id === editId;
                  return (
                    <div
                      key={e.id}
                      className={`py-4 flex items-start justify-between gap-4 ${
                        isSelected ? "bg-muted/40" : ""
                      }`}
                    >
                      <Link
                        href={`/v/${vaultId}/exercises?edit=${e.id}`}
                        scroll={false}
                        className="flex-1 space-y-1 px-2 -mx-2 rounded-md hover:bg-muted/40"
                      >
                        <div className="text-sm font-medium">{e.name}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{e.modality}</Badge>
                          {e.uses_bodyweight ? <Badge variant="secondary">Bodyweight</Badge> : null}
                        </div>
                      </Link>

                      <div className="flex items-center gap-2">


                        <form action={removeExercise.bind(null, vaultId, e.id)}>
                          <Button size="sm" type="submit" variant="destructive">
                            Delete
                          </Button>
                        </form>
                      </div>
                    </div>
                  );
                })}

                {exercises.length === 0 && (
                  <div className="py-6 text-sm text-muted-foreground">
                    No exercises yet. Create one above.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: preallocated editor space */}
        <div className="lg:sticky lg:top-6 h-fit">
          <ExerciseEditorPanel vaultId={vaultId} exercise={selected as any} />
        </div>
      </div>
    </div>
  );
}

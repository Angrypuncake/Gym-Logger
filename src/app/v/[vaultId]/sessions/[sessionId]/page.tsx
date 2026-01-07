import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  addExerciseToSession,
  saveSet,
  finishWorkout,
  discardWorkout,
  updateBodyweight,
  addSetToEntry,
  deleteUnloggedSet,
} from "./actions";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import SessionLogger from "./SessionLogger";
import ConfirmSubmitButton from "./ConfirmSubmitButton";

type SetRow = {
  id: string;
  entry_id: string;
  set_index: number;
  reps: number | null;
  weight_kg: number | null;
  duration_sec: number | null;
};

export default async function SessionPage({
  params,
}: {
  params: Promise<{ vaultId: string; sessionId: string }>;
}) {
  const { vaultId, sessionId } = await params;
  const supabase = await createClient();

  const { data: session, error: sErr } = await supabase
    .from("workout_sessions")
    .select(`
      id,
      date,
      session_date,
      notes,
      body_weight_kg,
      finished_at,
      template:templates!workout_sessions_template_fk(name)
    `)
    .eq("vault_id", vaultId)
    .eq("id", sessionId)
    .single();

  if (sErr) return <pre>{sErr.message}</pre>;
  if (!session) return <pre>Session not found</pre>;

  const isActive = session.finished_at === null;

  const templateName =
    (session.template as unknown as { name: string } | null)?.name ?? "Workout";

  const { data: entries, error: eErr } = await supabase
    .from("workout_entries")
    .select("id,order, exercise:exercises(id,name,modality,uses_bodyweight)")
    .eq("vault_id", vaultId)
    .eq("session_id", sessionId)
    .order("order", { ascending: true });

  if (eErr) return <pre>{eErr.message}</pre>;

  const entryIds = (entries ?? []).map((e: any) => e.id);

  let sets: SetRow[] = [];
  if (entryIds.length > 0) {
    const { data: s, error: setsErr } = await supabase
      .from("sets")
      .select("id,entry_id,set_index,reps,weight_kg,duration_sec")
      .eq("vault_id", vaultId)
      .in("entry_id", entryIds)
      .order("set_index", { ascending: true });

    if (setsErr) return <pre>{setsErr.message}</pre>;
    sets = (s ?? []) as any;
  }

  const setsByEntry = new Map<string, SetRow[]>();
  for (const s of sets) {
    const arr = setsByEntry.get(s.entry_id) ?? [];
    arr.push(s);
    setsByEntry.set(s.entry_id, arr);
  }

  const entriesWithSets = (entries ?? []).map((e: any) => ({
    ...e,
    sets: setsByEntry.get(e.id) ?? [],
  }));

  const planned = sets.length;
  const completed = sets.filter((x) => x.reps !== null || x.duration_sec !== null || x.weight_kg !== null).length;
  const pct = planned ? Math.round((completed / planned) * 100) : 0;

  const { data: allExercises } = await supabase
    .from("exercises")
    .select("id,name,modality")
    .eq("vault_id", vaultId)
    .order("name", { ascending: true });

  return (
    <div className="mx-auto max-w-[980px] px-4 py-6 space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2 w-full">
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href={`/v/${vaultId}`}>← Home</Link>
            </Button>

            <h1 className="text-sm font-semibold">
              {isActive ? "Current workout:" : "Workout:"}{" "}
              <span className="font-semibold">{templateName}</span>
            </h1>

            <Badge variant="outline">{completed}/{planned}</Badge>
            {!isActive && <Badge variant="secondary">Completed</Badge>}
          </div>

          <div className="text-xs text-muted-foreground">
            Session {session.session_date ?? new Date(session.date).toLocaleDateString()}
          </div>

          <Progress value={pct} />
        </div>

        {isActive && (
          <div className="flex items-center gap-2 shrink-0">
            <form action={finishWorkout.bind(null, vaultId, sessionId)}>
              <Button type="submit" size="sm">Finish</Button>
            </form>

            <form action={discardWorkout.bind(null, vaultId, sessionId)}>
              <ConfirmSubmitButton
                variant="destructive"
                size="sm"
                confirmText="Discard this workout? This deletes the session and all sets."
              >
                Discard
              </ConfirmSubmitButton>
            </form>
          </div>
        )}
      </header>

      <SessionLogger
        readOnly={false}
        entries={entriesWithSets as any}
        allExercises={(allExercises ?? []) as any}
        bodyWeightKg={session.body_weight_kg as number | null}
        updateBodyweightAction={updateBodyweight.bind(null, vaultId, sessionId)}
        addExerciseAction={addExerciseToSession.bind(null, vaultId, sessionId)}
        addSetAction={addSetToEntry.bind(null, vaultId, sessionId)}
        deleteUnloggedSetAction={deleteUnloggedSet.bind(null, vaultId, sessionId)}
        saveSetAction={saveSet.bind(null, vaultId, sessionId)}
      />
    </div>
  );
}

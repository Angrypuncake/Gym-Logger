import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  addExerciseToSession,
  saveSet,
  discardWorkout,
  updateBodyweight,
  addSetToEntry,
  deleteUnloggedSet,
  setStartNow,
  setFinishNow,
  clearStartTime,
  clearFinishTime,
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
      created_at,
      session_date,
      notes,
      body_weight_kg,
      started_at,
      finished_at,
      template:templates!workout_sessions_template_fk(name)
    `)
    .eq("vault_id", vaultId)
    .eq("id", sessionId)
    .single();

  if (sErr) return <pre>{sErr.message}</pre>;
  if (!session) return <pre>Session not found</pre>;

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
  const completed = sets.filter(
    (x) => x.reps !== null || x.duration_sec !== null || x.weight_kg !== null
  ).length;
  const pct = planned ? Math.round((completed / planned) * 100) : 0;

  const { data: allExercises, error: exErr } = await supabase
    .from("exercises")
    .select("id,name,modality")
    .eq("vault_id", vaultId)
    .order("name", { ascending: true });

  if (exErr) return <pre>{exErr.message}</pre>;

  const startSet = session.started_at !== null;
  const endSet = session.finished_at !== null;

  return (
    <div className="mx-auto max-w-[980px] px-4 py-6 space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2 w-full">
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href={`/v/${vaultId}/sessions`}>← Calendar</Link>
            </Button>

            <h1 className="text-sm font-semibold">
              Workout: <span className="font-semibold">{templateName}</span>
            </h1>

            <Badge variant="outline">
              {completed}/{planned}
            </Badge>
            <Badge variant="secondary">{pct}%</Badge>

            <Badge variant="outline">{startSet ? "Start set" : "No start"}</Badge>
            <Badge variant="outline">{endSet ? "End set" : "No end"}</Badge>
          </div>

          <div className="text-xs text-muted-foreground">
            Session {session.session_date}
            {session.created_at ? ` · Created ${new Date(session.created_at).toLocaleString()}` : null}
          </div>

          <Progress value={pct} />
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-2 justify-end">
            {!startSet ? (
              <form action={setStartNow.bind(null, vaultId, sessionId)}>
                <Button type="submit" size="sm" variant="secondary">
                  Set start = now
                </Button>
              </form>
            ) : (
              <form action={clearStartTime.bind(null, vaultId, sessionId)}>
                <Button type="submit" size="sm" variant="secondary">
                  Clear start
                </Button>
              </form>
            )}

            {!endSet ? (
              <form action={setFinishNow.bind(null, vaultId, sessionId)}>
                <Button type="submit" size="sm">
                  Set end = now
                </Button>
              </form>
            ) : (
              <form action={clearFinishTime.bind(null, vaultId, sessionId)}>
                <Button type="submit" size="sm" variant="secondary">
                  Clear end
                </Button>
              </form>
            )}
          </div>

          <form action={discardWorkout.bind(null, vaultId, sessionId)} className="flex justify-end">
            <ConfirmSubmitButton
              variant="destructive"
              size="sm"
              confirmText="Discard this session? This deletes the session and all entries/sets."
            >
              Discard
            </ConfirmSubmitButton>
          </form>
        </div>
      </header>

      <SessionLogger
        readOnly={false}
        entries={entriesWithSets as any}
        allExercises={(allExercises ?? []) as any}
        bodyWeightKg={session.body_weight_kg as number | null}
        updateBodyweightAction={updateBodyweight.bind(null, vaultId, sessionId)}
        saveSetAction={saveSet.bind(null, vaultId, sessionId)}
        addExerciseAction={addExerciseToSession.bind(null, vaultId, sessionId)}
        addSetAction={addSetToEntry.bind(null, vaultId, sessionId)}
        deleteUnloggedSetAction={deleteUnloggedSet.bind(null, vaultId, sessionId)}
      />
    </div>
  );
}

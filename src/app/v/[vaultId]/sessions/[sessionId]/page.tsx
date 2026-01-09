import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  addExerciseToSession,
  saveSet,
  updateBodyweight,
  addSetToEntry,
  deleteUnloggedSetFromForm,
  moveEntryUp,
  moveEntryDown,
  removeExerciseFromSession,
  
} from "./actions";

import SessionLogger from "./SessionLogger";
import { SessionHeader } from "./_components/SessionHeader";


type SetRow = {
  id: string;
  entry_id: string;
  set_index: number;
  reps: number | null;
  weight_kg: number | null;
  duration_sec: number | null;
};

const APP_TZ = "Australia/Sydney";

/** YYYY-MM-DD in fixed TZ */
function toDateYmd(valueIso: string, timeZone = APP_TZ) {
  const d = new Date(valueIso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** HH:mm in fixed TZ */
function toTimeLocal(valueIso: string, timeZone = APP_TZ) {
  const d = new Date(valueIso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("hour")}:${get("minute")}`;
}


export default async function SessionPage({ params }: { params: Promise<{ vaultId: string; sessionId: string }> }) {
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

  // FIXED DAY = created_at (in Australia/Sydney)
  const sessionDay = session.created_at ? toDateYmd(session.created_at) : (session.session_date as string);

  const startSet = session.started_at !== null;
  const endSet = session.finished_at !== null;

  const startTime = session.started_at ? toTimeLocal(session.started_at) : "";
  const endTime = session.finished_at ? toTimeLocal(session.finished_at) : "";
  const { data: entries, error: eErr } = await supabase
    .from("workout_entries")
    .select("id,sort_order, exercise:exercises(id,name,modality,uses_bodyweight)")
    .eq("vault_id", vaultId)
    .eq("session_id", sessionId)
    .order("sort_order", { ascending: true });

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
  

  
  // --- muscle targets (per exercise) for the session analytics panel ---
  type MuscleTarget = { targetId: string; targetName: string; role: string };
  const muscleTargetsByExerciseId: Record<string, MuscleTarget[]> = {};

  const exerciseIds = (entries ?? [])
    .map((e: any) => (e.exercise ? (e.exercise as any).id : null))
    .filter(Boolean) as string[];

  if (exerciseIds.length > 0) {
    const { data: tRows, error: tErr } = await supabase
      .from("exercise_targets")
      .select("exercise_id,role,target:anatomical_targets!exercise_targets_target_id_fkey(id,name,kind)")
      .eq("vault_id", vaultId)
      .in("exercise_id", exerciseIds);

    if (tErr) return <pre>{tErr.message}</pre>;

    for (const r of (tRows ?? []) as any[]) {
      const t = r.target;
      if (!t) continue;

      // exercise_targets should already be muscles in your model;
      // but keep a defensive filter to avoid tendon kinds leaking in.
      const kind = String(t.kind ?? "");
      if (kind.toUpperCase() === "TENDON") continue;

      const arr = muscleTargetsByExerciseId[r.exercise_id] ?? [];
      arr.push({ targetId: t.id, targetName: t.name, role: r.role });
      muscleTargetsByExerciseId[r.exercise_id] = arr;
    }
  }





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

  return (
    <div className="mx-auto max-w-[980px] px-4 py-6 space-y-4">
      <SessionHeader
        vaultId={vaultId}
        sessionId={sessionId}
        templateName={templateName}
        sessionDay={sessionDay}
        createdAt={session.created_at}
        planned={planned}
        completed={completed}
        pct={pct}
        startSet={startSet}
        endSet={endSet}
        startTime={startTime}
        endTime={endTime}
        bodyWeightKg={session.body_weight_kg as number | null}
        updateBodyweightAction={updateBodyweight.bind(null, vaultId, sessionId)}
      />

      <SessionLogger
        entries={entriesWithSets as any}
        allExercises={(allExercises ?? []) as any}
        bodyWeightKg={session.body_weight_kg as number | null}
        updateBodyweightAction={updateBodyweight.bind(null, vaultId, sessionId)}
        saveSetAction={saveSet.bind(null, vaultId, sessionId)}
        addExerciseAction={addExerciseToSession.bind(null, vaultId, sessionId)}
        addSetAction={addSetToEntry.bind(null, vaultId, sessionId)}
        deleteUnloggedSetAction={deleteUnloggedSetFromForm.bind(null, vaultId, sessionId)}
        removeEntryAction={removeExerciseFromSession.bind(null, vaultId, sessionId)}
        moveEntryUpAction={moveEntryUp.bind(null, vaultId, sessionId)}
        moveEntryDownAction={moveEntryDown.bind(null, vaultId, sessionId)}
        muscleTargetsByExerciseId={muscleTargetsByExerciseId}
      />
    </div>
  );
}
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  addExerciseToSession,
  saveSet,
  discardWorkout,
  updateBodyweight,
  addSetToEntry,
  deleteUnloggedSetFromForm,
  clearStartTime,
  clearFinishTime,
  setStartTimeFromForm,
  setFinishTimeFromForm,
  removeExerciseFromSession,
  
} from "./actions";

import { Button } from "@/components/ui/button";


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


/**
 * datetime-local expects: YYYY-MM-DDTHH:mm (no timezone).
 * IMPORTANT: this runs on the server, so use a fixed TZ to avoid UTC shifts.
 */
function toDatetimeLocal(valueIso: string, timeZone = APP_TZ) {
  const d = new Date(valueIso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function TimingControlRow(props: {
  label: string;
  isSet: boolean;
  inputName: "started_at" | "finished_at";
  defaultValue: string;
  nowAction: (formData: FormData) => Promise<void>;
  clearAction: (formData: FormData) => Promise<void>;
  saveAction: (formData: FormData) => Promise<void>;
  nowVariant?: "default" | "secondary";
}) {
  const {
    label,
    isSet,
    inputName,
    defaultValue,
    nowAction,
    clearAction,
    saveAction,
    nowVariant = "secondary",
  } = props;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        {!isSet ? (
          <form action={nowAction}>
            <Button type="submit" size="sm" variant={nowVariant}>
              Set now
            </Button>
          </form>
        ) : (
          <form action={clearAction}>
            <Button type="submit" size="sm" variant="secondary">
              Clear
            </Button>
          </form>
        )}
      </div>

      <form action={saveAction} className="flex items-center gap-2">
        <input
          name={inputName}
          type="datetime-local"
          defaultValue={defaultValue}
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" size="sm" variant="secondary">
          Save
        </Button>
      </form>
    </div>
  );
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
      />
    </div>
  );
}
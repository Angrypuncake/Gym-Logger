import { createClient } from "@/lib/supabase/server";
import { monthStartKey, monthEndKey, sydneyKey } from "@/lib/datesSydney";
import type { SummaryRow, TemplateRow } from "./types";

function clampPct(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export type SessionPageSetRow = {
  id: string;
  entry_id: string;
  set_index: number;
  reps: number | null;
  weight_kg: number | null;
  duration_sec: number | null;
};

type MuscleTarget = { targetId: string; targetName: string; role: string };

export async function getSessionPageData(params: {
  vaultId: string;
  sessionId: string;
}) {
  const { vaultId, sessionId } = params;
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

  if (sErr) throw new Error(sErr.message);
  if (!session) throw new Error("Session not found");

  const { data: entries, error: eErr } = await supabase
    .from("workout_entries")
    .select("id,sort_order, exercise:exercises(id,name,modality,uses_bodyweight)")
    .eq("vault_id", vaultId)
    .eq("session_id", sessionId)
    .order("sort_order", { ascending: true });

  if (eErr) throw new Error(eErr.message);

  const entryIds = (entries ?? []).map((e: any) => e.id);

  let sets: SessionPageSetRow[] = [];
  if (entryIds.length > 0) {
    const { data: s, error: setsErr } = await supabase
      .from("sets")
      .select("id,entry_id,set_index,reps,weight_kg,duration_sec")
      .eq("vault_id", vaultId)
      .in("entry_id", entryIds)
      .order("set_index", { ascending: true });

    if (setsErr) throw new Error(setsErr.message);
    sets = (s ?? []) as any;
  }

  const setsByEntry = new Map<string, SessionPageSetRow[]>();
  for (const s of sets) {
    const arr = setsByEntry.get(s.entry_id) ?? [];
    arr.push(s);
    setsByEntry.set(s.entry_id, arr);
  }

  const entriesWithSets = (entries ?? []).map((e: any) => ({
    ...e,
    sets: setsByEntry.get(e.id) ?? [],
  }));

  const exerciseIds = (entries ?? [])
    .map((e: any) => (e.exercise ? (e.exercise as any).id : null))
    .filter(Boolean) as string[];

  const muscleTargetsByExerciseId: Record<string, MuscleTarget[]> = {};

  if (exerciseIds.length > 0) {
    const { data: tRows, error: tErr } = await supabase
      .from("exercise_targets")
      .select(
        "exercise_id,role,target:anatomical_targets!exercise_targets_target_id_fkey(id,name,kind)"
      )
      .eq("vault_id", vaultId)
      .in("exercise_id", exerciseIds);

    if (tErr) throw new Error(tErr.message);

    for (const r of (tRows ?? []) as any[]) {
      const t = r.target;
      if (!t) continue;

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

  if (exErr) throw new Error(exErr.message);

  return {
    session,
    entriesWithSets,
    sets,
    planned,
    completed,
    pct,
    allExercises: allExercises ?? [],
    muscleTargetsByExerciseId,
  };
}

export async function getSessionProgressPct(vaultId: string, sessionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sets")
    .select("reps,duration_sec, workout_entries!inner(session_id)")
    .eq("vault_id", vaultId)
    .eq("workout_entries.session_id", sessionId);

  if (error) throw new Error(error.message);

  const total = data?.length ?? 0;
  const done =
    data?.filter((s) => s.reps !== null || s.duration_sec !== null).length ?? 0;

  return total === 0 ? 0 : clampPct((done / total) * 100);
}

export async function getSessionSummariesForMonth(
  vaultId: string,
  year: number,
  month0: number
) {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("session_summaries")
    .select("*")
    .eq("vault_id", vaultId)
    .gte("session_date", monthStartKey(year, month0))
    .lte("session_date", monthEndKey(year, month0))
    .order("session_date", { ascending: true })
    .order("started_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SummaryRow[];
}

export async function getTemplatesForVault(vaultId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("templates")
    .select("id,name,sort_order")
    .eq("vault_id", vaultId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as TemplateRow[];
}

export async function getTrainedDaysInRange(
  vaultId: string,
  since: Date,
  until: Date
) {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("session_summaries")
    .select("session_date,logged_sets")
    .eq("vault_id", vaultId)
    .gte("session_date", sydneyKey(since))
    .lte("session_date", sydneyKey(until));

  if (error) throw new Error(error.message);

  const trained = new Set<string>(
    (data ?? [])
      .filter((r: any) => Number(r.logged_sets ?? 0) > 0)
      .map((r: any) => String(r.session_date))
  );

  return trained;
}

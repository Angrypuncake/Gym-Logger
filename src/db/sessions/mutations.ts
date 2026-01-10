import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/types/supabase";
import { maybeRecordPr } from "./prs";

export async function saveSetDb(params: {
  vaultId: string;
  sessionId: string;
  setId: string;
  reps: number | null;
  weightKg: number | null;
  durationSec: number | null;
}) {
  const { vaultId, sessionId, setId, reps, weightKg, durationSec } = params;
  const supabase = await createClient();

  const { data: owner, error: ownerErr } = await supabase
    .from("sets")
    .select(
      `
      id,
      entry_id,
      workout_entries!inner(
        session_id,
        exercise_id,
        exercises!inner(modality)
      )
    `
    )
    .eq("id", setId)
    .eq("vault_id", vaultId)
    .eq("workout_entries.session_id", sessionId)
    .maybeSingle();

  if (ownerErr) throw new Error(ownerErr.message);
  if (!owner) throw new Error("Set not found for this session.");

  const exerciseId = (owner as any).workout_entries?.exercise_id as
    | string
    | undefined;
  const modality = (owner as any).workout_entries?.exercises?.modality as
    | "REPS"
    | "ISOMETRIC"
    | undefined;

  if (!exerciseId || !modality) throw new Error("Set is missing exercise linkage.");

  if (reps !== null && durationSec !== null) {
    throw new Error("Set cannot have both reps and duration.");
  }

  const patch: {
    reps: number | null;
    weight_kg: number | null;
    duration_sec: number | null;
  } = { reps: null, weight_kg: null, duration_sec: null };

  if (modality === "REPS") {
    if (durationSec !== null) throw new Error("Duration not allowed for REPS modality.");
    patch.reps = reps;
    patch.weight_kg = weightKg;
  } else {
    if (reps !== null) throw new Error("Reps not allowed for ISOMETRIC modality.");
    patch.duration_sec = durationSec;
  }

  const { error: upErr } = await supabase
    .from("sets")
    .update(patch)
    .eq("id", setId)
    .eq("vault_id", vaultId);

  if (upErr) throw new Error(upErr.message);

  const hasValue =
    (modality === "REPS" && (patch.reps !== null || patch.weight_kg !== null)) ||
    (modality === "ISOMETRIC" && patch.duration_sec !== null);

  if (hasValue) {
    await maybeRecordPr({
      supabase,
      vaultId,
      sessionId,
      setId,
      exerciseId,
      modality,
      reps: patch.reps,
      weightKg: patch.weight_kg,
      durationSec: patch.duration_sec,
    });
  }
}

export async function removeExerciseFromSessionDb(params: {
  vaultId: string;
  sessionId: string;
  entryId: string;
}) {
  const { vaultId, sessionId, entryId } = params;
  const supabase = await createClient();

  const { data: entry, error: eErr } = await supabase
    .from("workout_entries")
    .select("id")
    .eq("vault_id", vaultId)
    .eq("session_id", sessionId)
    .eq("id", entryId)
    .single();

  if (eErr) throw new Error(eErr.message);
  if (!entry) throw new Error("Entry not found for this session.");

  const { data: sets, error: sErr } = await supabase
    .from("sets")
    .select("id,reps,weight_kg,duration_sec")
    .eq("vault_id", vaultId)
    .eq("entry_id", entryId);

  if (sErr) throw new Error(sErr.message);

  const hasLogged = (sets ?? []).some(
    (s) => s.reps !== null || s.weight_kg !== null || s.duration_sec !== null
  );
  if (hasLogged) {
    throw new Error(
      "Cannot remove an exercise that has logged sets. Clear those sets first."
    );
  }

  const { error: delSetsErr } = await supabase
    .from("sets")
    .delete()
    .eq("vault_id", vaultId)
    .eq("entry_id", entryId);
  if (delSetsErr) throw new Error(delSetsErr.message);

  const { error: delEntryErr } = await supabase
    .from("workout_entries")
    .delete()
    .eq("vault_id", vaultId)
    .eq("id", entryId);
  if (delEntryErr) throw new Error(delEntryErr.message);
}

export async function addExerciseToSessionDb(params: {
  vaultId: string;
  sessionId: string;
  exerciseId: string;
  seedSets?: number; // default 3
}) {
  const { vaultId, sessionId, exerciseId, seedSets = 3 } = params;
  const supabase = await createClient();

  const { data: session, error: sErr } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("vault_id", vaultId)
    .single();

  if (sErr) throw new Error(sErr.message);
  if (!session) throw new Error("Session not found.");

  const { data: lastEntry } = await supabase
    .from("workout_entries")
    .select("sort_order")
    .eq("vault_id", vaultId)
    .eq("session_id", sessionId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (lastEntry?.sort_order ?? 0) + 1;

  const entryPayload: TablesInsert<"workout_entries"> = {
    vault_id: vaultId,
    session_id: sessionId,
    exercise_id: exerciseId,
    sort_order: nextOrder,
  };

  const { data: entry, error: eErr } = await supabase
    .from("workout_entries")
    .insert(entryPayload)
    .select("id")
    .single();

  if (eErr) throw new Error(eErr.message);

  const setsPayload: TablesInsert<"sets">[] = Array.from({ length: seedSets }).map(
    (_, idx) => ({
      vault_id: vaultId,
      entry_id: entry.id,
      set_index: idx + 1,
    })
  );

  const { error: setsErr } = await supabase.from("sets").insert(setsPayload);
  if (setsErr) throw new Error(setsErr.message);
}

export async function addSetToEntryDb(params: {
  vaultId: string;
  sessionId: string;
  entryId: string;
}) {
  const { vaultId, sessionId, entryId } = params;
  const supabase = await createClient();

  const { data: entry, error: eErr } = await supabase
    .from("workout_entries")
    .select("id")
    .eq("vault_id", vaultId)
    .eq("session_id", sessionId)
    .eq("id", entryId)
    .single();

  if (eErr) throw new Error(eErr.message);
  if (!entry) throw new Error("Entry not found for this session.");

  const { data: last, error: lastErr } = await supabase
    .from("sets")
    .select("set_index")
    .eq("vault_id", vaultId)
    .eq("entry_id", entryId)
    .order("set_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastErr) throw new Error(lastErr.message);

  const nextIndex = (last?.set_index ?? 0) + 1;

  const { error } = await supabase.from("sets").insert({
    vault_id: vaultId,
    entry_id: entryId,
    set_index: nextIndex,
    reps: null,
    weight_kg: null,
    duration_sec: null,
  });

  if (error) throw new Error(error.message);
}

export async function deleteUnloggedSetDb(params: {
  vaultId: string;
  sessionId: string;
  setId: string;
}) {
  const { vaultId, sessionId, setId } = params;
  const supabase = await createClient();

  const { data: s, error: readErr } = await supabase
    .from("sets")
    .select("id,entry_id,reps,weight_kg,duration_sec")
    .eq("vault_id", vaultId)
    .eq("id", setId)
    .single();

  if (readErr) throw new Error(readErr.message);
  if (!s) throw new Error("Set not found.");

  const { data: entry, error: eErr } = await supabase
    .from("workout_entries")
    .select("id")
    .eq("vault_id", vaultId)
    .eq("session_id", sessionId)
    .eq("id", s.entry_id)
    .single();

  if (eErr) throw new Error(eErr.message);
  if (!entry) throw new Error("Set not found for this session.");

  const isLogged =
    s.reps !== null || s.weight_kg !== null || s.duration_sec !== null;
  if (isLogged) throw new Error("Cannot delete a logged set. Clear it first.");

  const { error: delErr } = await supabase
    .from("sets")
    .delete()
    .eq("vault_id", vaultId)
    .eq("id", setId);

  if (delErr) throw new Error(delErr.message);
}

export async function updateBodyweightDb(params: {
  vaultId: string;
  sessionId: string;
  bodyWeightKg: number | null;
}) {
  const { vaultId, sessionId, bodyWeightKg } = params;

  if (
    bodyWeightKg !== null &&
    (!Number.isFinite(bodyWeightKg) || bodyWeightKg < 20 || bodyWeightKg > 250)
  ) {
    throw new Error("body_weight_kg must be between 20 and 250 (or null).");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("workout_sessions")
    .update({ body_weight_kg: bodyWeightKg })
    .eq("vault_id", vaultId)
    .eq("id", sessionId);

  if (error) throw new Error(error.message);
}

export async function discardWorkoutDb(params: {
  vaultId: string;
  sessionId: string;
}) {
  const { vaultId, sessionId } = params;
  const supabase = await createClient();

  const { data: entries, error: eErr } = await supabase
    .from("workout_entries")
    .select("id")
    .eq("vault_id", vaultId)
    .eq("session_id", sessionId);

  if (eErr) throw new Error(eErr.message);

  const entryIds = (entries ?? []).map((e) => e.id);

  if (entryIds.length > 0) {
    const { error: sErr } = await supabase
      .from("sets")
      .delete()
      .eq("vault_id", vaultId)
      .in("entry_id", entryIds);
    if (sErr) throw new Error(sErr.message);
  }

  const { error: delEntriesErr } = await supabase
    .from("workout_entries")
    .delete()
    .eq("vault_id", vaultId)
    .eq("session_id", sessionId);
  if (delEntriesErr) throw new Error(delEntriesErr.message);

  const { error: delSessionErr } = await supabase
    .from("workout_sessions")
    .delete()
    .eq("vault_id", vaultId)
    .eq("id", sessionId);
  if (delSessionErr) throw new Error(delSessionErr.message);
}

export async function updateSessionTimesDb(params: {
  supabase?: any;
  vaultId: string;
  sessionId: string;
  patch: { started_at?: string | null; finished_at?: string | null };
}) {
  const { vaultId, sessionId, patch } = params;
  const supabase = params.supabase ?? (await createClient());

  const { error } = await supabase
    .from("workout_sessions")
    .update(patch)
    .eq("vault_id", vaultId)
    .eq("id", sessionId);

  if (error) throw new Error(error.message);
}

export async function swapEntryOrderDb(params: {
  vaultId: string;
  sessionId: string;
  entryId: string;
  direction: "UP" | "DOWN";
}) {
  const { vaultId, sessionId, entryId, direction } = params;
  const supabase = await createClient();

  const { data: current, error: curErr } = await supabase
    .from("workout_entries")
    .select("id,sort_order")
    .eq("vault_id", vaultId)
    .eq("session_id", sessionId)
    .eq("id", entryId)
    .single();

  if (curErr) throw new Error(curErr.message);
  if (!current) return;

  const currentOrder = Number(current.sort_order);

  const base = supabase
    .from("workout_entries")
    .select("id,sort_order")
    .eq("vault_id", vaultId)
    .eq("session_id", sessionId);

  const { data: neighbor, error: nErr } =
    direction === "UP"
      ? await base
          .lt("sort_order", currentOrder)
          .order("sort_order", { ascending: false })
          .limit(1)
          .maybeSingle()
      : await base
          .gt("sort_order", currentOrder)
          .order("sort_order", { ascending: true })
          .limit(1)
          .maybeSingle();

  if (nErr) throw new Error(nErr.message);
  if (!neighbor) return;

  const neighborOrder = Number(neighbor.sort_order);

  const tmp = -2147483648; // int32 min

  const { error: e1 } = await supabase
    .from("workout_entries")
    .update({ sort_order: tmp })
    .eq("vault_id", vaultId)
    .eq("session_id", sessionId)
    .eq("id", current.id);
  if (e1) throw new Error(e1.message);

  const { error: e2 } = await supabase
    .from("workout_entries")
    .update({ sort_order: currentOrder })
    .eq("vault_id", vaultId)
    .eq("session_id", sessionId)
    .eq("id", neighbor.id);
  if (e2) throw new Error(e2.message);

  const { error: e3 } = await supabase
    .from("workout_entries")
    .update({ sort_order: neighborOrder })
    .eq("vault_id", vaultId)
    .eq("session_id", sessionId)
    .eq("id", current.id);
  if (e3) throw new Error(e3.message);
}

"use server";

import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/types/supabase";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type PrType = "REPS_MAX_WEIGHT" | "REPS_MAX_REPS" | "ISO_MAX_DURATION";

async function assertSessionActive(supabase: any, vaultId: string, sessionId: string) {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("id, finished_at")
    .eq("vault_id", vaultId)
    .eq("id", sessionId)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Session not found.");
  if (data.finished_at !== null) throw new Error("Session is already finished.");
}

async function maybeRecordPr(params: {
  supabase: any;
  vaultId: string;
  sessionId: string;
  setId: string;
  exerciseId: string;
  modality: "REPS" | "ISOMETRIC";
  reps: number | null;
  weightKg: number | null;
  durationSec: number | null;
}) {
  const { supabase, vaultId, sessionId, setId, exerciseId, modality, reps, weightKg, durationSec } = params;

  const candidates: Array<{ pr_type: PrType; value: number }> = [];
  if (modality === "REPS") {
    if (weightKg != null && Number.isFinite(weightKg)) candidates.push({ pr_type: "REPS_MAX_WEIGHT", value: weightKg });
    if (reps != null && Number.isFinite(reps)) candidates.push({ pr_type: "REPS_MAX_REPS", value: reps });
  } else {
    if (durationSec != null && Number.isFinite(durationSec)) candidates.push({ pr_type: "ISO_MAX_DURATION", value: durationSec });
  }

  for (const c of candidates) {
    const { data: existing, error: readErr } = await supabase
      .from("exercise_prs")
      .select("value")
      .eq("vault_id", vaultId)
      .eq("exercise_id", exerciseId)
      .eq("pr_type", c.pr_type)
      .maybeSingle();

    if (readErr) throw new Error(readErr.message);

    const prev = existing?.value == null ? null : Number(existing.value);
    const isBetter = prev === null || c.value > prev;
    if (!isBetter) continue;

    const { error: upsertErr } = await supabase
      .from("exercise_prs")
      .upsert(
        {
          vault_id: vaultId,
          exercise_id: exerciseId,
          pr_type: c.pr_type,
          value: c.value,
          achieved_at: new Date().toISOString(),
          session_id: sessionId,
          set_id: setId,
        },
        { onConflict: "vault_id,exercise_id,pr_type" }
      );

    if (upsertErr) throw new Error(upsertErr.message);

    const { error: evtErr } = await supabase.from("pr_events").insert({
      vault_id: vaultId,
      exercise_id: exerciseId,
      pr_type: c.pr_type,
      value: c.value,
      achieved_at: new Date().toISOString(),
      session_id: sessionId,
      set_id: setId,
    });

    if (evtErr) throw new Error(evtErr.message);
  }
}
export async function saveSet(vaultId: string, sessionId: string, formData: FormData) {
  const setId = String(formData.get("set_id") || "").trim();
  if (!setId) return;

  // Parse + validate inputs (reject NaN, negatives, and absurd values)
  const repsRaw = formData.get("reps");
  const weightRaw = formData.get("weight_kg");
  const durRaw = formData.get("duration_sec");

  function parseNullableInt(v: FormDataEntryValue | null, max: number) {
    if (v === null || v === "") return null;
    const n = Number(v);
    if (!Number.isFinite(n) || !Number.isInteger(n)) throw new Error("Invalid number");
    if (n < 0) throw new Error("Negative not allowed");
    if (n > max) throw new Error("Value too large");
    return n;
  }

  function parseNullableNumber(v: FormDataEntryValue | null, max: number) {
    if (v === null || v === "") return null;
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error("Invalid number");
    if (n < 0) throw new Error("Negative not allowed");
    if (n > max) throw new Error("Value too large");
    return n;
  }

  const reps = parseNullableInt(repsRaw, 1000); // generous upper bound
  const durationSec = parseNullableInt(durRaw, 60 * 60 * 4); // 4h
  const weightKg = parseNullableNumber(weightRaw, 2000); // generous upper bound

  // At least one field must be present (otherwise meaningless write)
  if (reps === null && durationSec === null && weightKg === null) {
    // choose either: return silently or clear the set. Here: return.
    return;
  }

  // Basic modality-shape guard (avoid reps+duration combos unless you explicitly support it)
  // If you want to allow both, delete this block.
  if (reps !== null && durationSec !== null) {
    throw new Error("Set cannot have both reps and duration.");
  }

  const supabase = await createClient();

  // Verify set belongs to (vaultId, sessionId) and fetch exercise modality in one go.
  // This prevents editing arbitrary sets by guessing IDs.
  const { data: owner, error: ownerErr } = await supabase
    .from("sets")
    .select(
      `
      id,
      entry_id,
      workout_entries!inner(
        session_id,
        exercise_id,
        exercises!inner(
          modality
        )
      )
    `
    )
    .eq("id", setId)
    .eq("vault_id", vaultId)
    .eq("workout_entries.session_id", sessionId)
    .maybeSingle();

  if (ownerErr) throw new Error(ownerErr.message);
  if (!owner) throw new Error("Set not found for this session.");

  const exerciseId = (owner as any).workout_entries?.exercise_id as string | undefined;
  const modality = (owner as any).workout_entries?.exercises?.modality as string | undefined;

  if (!exerciseId || !modality) throw new Error("Set is missing exercise linkage.");

  // Enforce modality-specific fields (prevents writing duration for REPS etc.)
  if (modality === "REPS") {
    if (durationSec !== null) throw new Error("Duration not allowed for REPS modality.");
    // reps can be null if you are clearing; you currently don't clear. enforce reps present:
    // if (reps === null) throw new Error("Reps required for REPS modality.");
  } else if (modality === "ISOMETRIC") {
    if (reps !== null) throw new Error("Reps not allowed for ISOMETRIC modality.");
    // if (durationSec === null) throw new Error("Duration required for ISOMETRIC modality.");
  }

  // Update only allowed columns; keep scope restricted to this vault+id
  const patch: { reps: number | null; weight_kg: number | null; duration_sec: number | null } = {
    reps,
    weight_kg: weightKg,
    duration_sec: durationSec,
  };

  const { error: upErr } = await supabase
    .from("sets")
    .update(patch)
    .eq("id", setId)
    .eq("vault_id", vaultId);

  if (upErr) throw new Error(upErr.message);

  // PR detection (use modality already fetched; avoid extra query)
  await maybeRecordPr({
    supabase,
    vaultId,
    sessionId,
    setId,
    exerciseId,
    modality: modality as any,
    reps,
    weightKg,
    durationSec,
  });

  revalidatePath(`/v/${vaultId}`);
  revalidatePath(`/v/${vaultId}/sessions`);
  revalidatePath(`/v/${vaultId}/sessions/${sessionId}`);
}


export async function addExerciseToSession(vaultId: string, sessionId: string, formData: FormData) {
  await assertSessionAllowsStructuralEdit(vaultId, sessionId);
  const exerciseId = String(formData.get("exercise_id") || "").trim();
  if (!exerciseId) return;

  const supabase = await createClient();

  // validate session exists
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
    .select("order")
    .eq("vault_id", vaultId)
    .eq("session_id", sessionId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (lastEntry?.order ?? 0) + 1;

  const entryPayload: TablesInsert<"workout_entries"> = {
    vault_id: vaultId,
    session_id: sessionId,
    exercise_id: exerciseId,
    order: nextOrder,
  };

  const { data: entry, error: eErr } = await supabase
    .from("workout_entries")
    .insert(entryPayload)
    .select("id")
    .single();

  if (eErr) throw new Error(eErr.message);

  const setsPayload: TablesInsert<"sets">[] = [1, 2, 3].map((i) => ({
    vault_id: vaultId,
    entry_id: entry.id,
    set_index: i,
  }));

  const { error: setsErr } = await supabase.from("sets").insert(setsPayload);
  if (setsErr) throw new Error(setsErr.message);

  revalidatePath(`/v/${vaultId}/sessions/${sessionId}`);
  revalidatePath(`/v/${vaultId}/sessions`);
  revalidatePath(`/v/${vaultId}`);
}

export async function addSetToEntry(vaultId: string, sessionId: string, entryId: string) {
  await assertSessionAllowsStructuralEdit(vaultId, sessionId);
  const supabase = await createClient();

  // Ensure entry belongs to this session
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

  revalidatePath(`/v/${vaultId}/sessions/${sessionId}`);
}

export async function deleteUnloggedSet(vaultId: string, sessionId: string, setId: string) {
  await assertSessionAllowsStructuralEdit(vaultId, sessionId);
  const supabase = await createClient();

  const { data: s, error: readErr } = await supabase
    .from("sets")
    .select("id,entry_id,reps,weight_kg,duration_sec")
    .eq("vault_id", vaultId)
    .eq("id", setId)
    .single();

  if (readErr) throw new Error(readErr.message);

  // verify set belongs to session
  const { data: entry, error: eErr } = await supabase
    .from("workout_entries")
    .select("id")
    .eq("vault_id", vaultId)
    .eq("session_id", sessionId)
    .eq("id", s.entry_id)
    .single();

  if (eErr) throw new Error(eErr.message);
  if (!entry) throw new Error("Set not found for this session.");

  const isLogged = s.reps !== null || s.weight_kg !== null || s.duration_sec !== null;
  if (isLogged) throw new Error("Cannot delete a logged set. Clear it first.");

  const { error: delErr } = await supabase
    .from("sets")
    .delete()
    .eq("vault_id", vaultId)
    .eq("id", setId);

  if (delErr) throw new Error(delErr.message);

  revalidatePath(`/v/${vaultId}/sessions/${sessionId}`);
}

export async function updateBodyweight(vaultId: string, sessionId: string, formData: FormData) {
  const raw = String(formData.get("body_weight_kg") ?? "").trim();
  const bw = raw === "" ? null : Number(raw);

  if (bw !== null && (!Number.isFinite(bw) || bw < 20 || bw > 250)) {
    throw new Error("body_weight_kg must be between 20 and 250 (or blank).");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("workout_sessions")
    .update({ body_weight_kg: bw })
    .eq("vault_id", vaultId)
    .eq("id", sessionId);

  if (error) throw new Error(error.message);

  revalidatePath(`/v/${vaultId}/sessions/${sessionId}`);
  revalidatePath(`/v/${vaultId}`);
  revalidatePath(`/v/${vaultId}/sessions`);
}

export async function finishWorkout(vaultId: string, sessionId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("workout_sessions")
    .update({ finished_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("vault_id", vaultId)
    .is("finished_at", null);

  if (error) throw new Error(error.message);

  redirect(`/v/${vaultId}`);
}

export async function discardWorkout(vaultId: string, sessionId: string) {
  await assertSessionAllowsStructuralEdit(vaultId, sessionId);
  const supabase = await createClient();

  // Only allow discarding an ACTIVE session (safety)
  await assertSessionActive(supabase, vaultId, sessionId);

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

  revalidatePath(`/v/${vaultId}`);
  revalidatePath(`/v/${vaultId}/sessions`);
  redirect(`/v/${vaultId}`);
}

async function getSessionFinishedAt(vaultId: string, sessionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("finished_at")
    .eq("vault_id", vaultId)
    .eq("id", sessionId)
    .single();

  if (error) throw new Error(error.message);
  return data?.finished_at ?? null;
}

async function assertSessionAllowsStructuralEdit(vaultId: string, sessionId: string) {
  const finishedAt = await getSessionFinishedAt(vaultId, sessionId);
  if (finishedAt) throw new Error("Workout is completed. Structural edits are disabled.");
}


async function getSessionTimes(supabase: any, vaultId: string, sessionId: string) {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("started_at,finished_at")
    .eq("vault_id", vaultId)
    .eq("id", sessionId)
    .single();

  if (error) throw new Error(error.message);
  return data as { started_at: string | null; finished_at: string | null };
}

async function updateSessionTimes(
  supabase: any,
  vaultId: string,
  sessionId: string,
  patch: { started_at?: string | null; finished_at?: string | null }
) {
  const { error } = await supabase
    .from("workout_sessions")
    .update(patch)
    .eq("vault_id", vaultId)
    .eq("id", sessionId);

  if (error) throw new Error(error.message);

  revalidatePath(`/v/${vaultId}/sessions`);
  revalidatePath(`/v/${vaultId}/sessions/${sessionId}`);
}

export async function setStartNow(vaultId: string, sessionId: string) {
  const supabase = await createClient();
  const t = await getSessionTimes(supabase, vaultId, sessionId);

  const nowIso = new Date().toISOString();
  const patch: { started_at: string; finished_at?: string } = { started_at: nowIso };

  // preserve CHECK (finished_at >= started_at)
  if (t.finished_at) {
    const fin = new Date(t.finished_at).getTime();
    const now = new Date(nowIso).getTime();
    if (fin < now) patch.finished_at = nowIso;
  }

  await updateSessionTimes(supabase, vaultId, sessionId, patch);
}

export async function clearStartTime(vaultId: string, sessionId: string) {
  const supabase = await createClient();
  await updateSessionTimes(supabase, vaultId, sessionId, { started_at: null });
}

export async function setFinishNow(vaultId: string, sessionId: string) {
  const supabase = await createClient();
  const t = await getSessionTimes(supabase, vaultId, sessionId);

  const nowIso = new Date().toISOString();
  const patch: { finished_at: string; started_at?: string } = { finished_at: nowIso };

  // preserve CHECK (finished_at >= started_at)
  if (t.started_at) {
    const start = new Date(t.started_at).getTime();
    const now = new Date(nowIso).getTime();
    if (start > now) patch.started_at = nowIso;
  }

  await updateSessionTimes(supabase, vaultId, sessionId, patch);
}

export async function clearFinishTime(vaultId: string, sessionId: string) {
  const supabase = await createClient();
  await updateSessionTimes(supabase, vaultId, sessionId, { finished_at: null });
}
"use server";

import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/types/supabase";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type PrType = "REPS_MAX_WEIGHT" | "REPS_MAX_REPS" | "ISO_MAX_DURATION";

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

  const repsRaw = formData.get("reps");
  const weightRaw = formData.get("weight_kg");
  const durRaw = formData.get("duration_sec");

  function parseNullableInt(v: FormDataEntryValue | null, max: number) {
    if (v === null || v === "") return null; // blank => UNSET
    const n = Number(v);
    if (!Number.isFinite(n) || !Number.isInteger(n)) throw new Error("Invalid number");
    if (n < 0) throw new Error("Negative not allowed");
    if (n > max) throw new Error("Value too large");
    return n;
  }

  function parseNullableNumber(v: FormDataEntryValue | null, max: number) {
    if (v === null || v === "") return null; // blank => UNSET
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error("Invalid number");
    if (n < 0) throw new Error("Negative not allowed");
    if (n > max) throw new Error("Value too large");
    return n;
  }

  const reps = parseNullableInt(repsRaw, 1000);
  const durationSec = parseNullableInt(durRaw, 60 * 60 * 4);
  const weightKg = parseNullableNumber(weightRaw, 2000);

  // Allow clearing everything (all null) -> this is "unset"
  // REMOVE the old early-return block entirely.

  // Still disallow reps+duration when both present (but both null is fine)
  if (reps !== null && durationSec !== null) {
    throw new Error("Set cannot have both reps and duration.");
  }

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

  const exerciseId = (owner as any).workout_entries?.exercise_id as string | undefined;
  const modality = (owner as any).workout_entries?.exercises?.modality as "REPS" | "ISOMETRIC" | undefined;
  if (!exerciseId || !modality) throw new Error("Set is missing exercise linkage.");

  // Enforce modality AND clear incompatible fields to avoid stale data.
  const patch: { reps: number | null; weight_kg: number | null; duration_sec: number | null } = {
    reps: null,
    weight_kg: null,
    duration_sec: null,
  };

  if (modality === "REPS") {
    if (durationSec !== null) throw new Error("Duration not allowed for REPS modality.");
    patch.reps = reps; // may be null => unset
    patch.weight_kg = weightKg; // may be null => unset
    patch.duration_sec = null;
  } else {
    if (reps !== null) throw new Error("Reps not allowed for ISOMETRIC modality.");
    if (weightKg !== null) {
      // if you truly never want external load for isometrics, keep this strict:
      throw new Error("Weight not allowed for ISOMETRIC modality.");
    }
    patch.duration_sec = durationSec; // may be null => unset
    patch.reps = null;
    patch.weight_kg = null;
  }

  const { error: upErr } = await supabase.from("sets").update(patch).eq("id", setId).eq("vault_id", vaultId);
  if (upErr) throw new Error(upErr.message);

  // Only record PRs if something is actually logged after this write.
  // (Prevents "clearing" from doing any PR work.)
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

  revalidatePath(`/v/${vaultId}`);
  revalidatePath(`/v/${vaultId}/sessions`);
  revalidatePath(`/v/${vaultId}/sessions/${sessionId}`);
}

export async function removeExerciseFromSession(
  vaultId: string,
  sessionId: string,
  entryId: string
) {
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

  // Safety: block deletion if any set is logged
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
    throw new Error("Cannot remove an exercise that has logged sets. Clear those sets first.");
  }

  // Delete sets then entry
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

  revalidatePath(`/v/${vaultId}/sessions/${sessionId}`);
  revalidatePath(`/v/${vaultId}/sessions`);
  revalidatePath(`/v/${vaultId}`);
}


export async function addExerciseToSession(vaultId: string, sessionId: string, formData: FormData) {
  await (sessionId);
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
  await (sessionId);
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

  const nextIndex = (last?.set_index ?? 0);

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
  const supabase = await createClient();

  const { data: s, error: readErr } = await supabase
    .from("sets")
    .select("id,entry_id,reps,weight_kg,duration_sec")
    .eq("vault_id", vaultId)
    .eq("id", setId)
    .single();

  if (readErr) throw new Error(readErr.message);
  if (!s) throw new Error("Set not found.");

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
  await (sessionId);
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

  revalidatePath(`/v/${vaultId}`);
  revalidatePath(`/v/${vaultId}/sessions`);
  redirect(`/v/${vaultId}`);
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
export async function deleteUnloggedSetFromForm(vaultId: string, sessionId: string, formData: FormData) {
  const setId = String(formData.get("set_id") ?? "");
  if (!setId) throw new Error("Missing set_id");

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

  const isLogged = s.reps !== null || s.weight_kg !== null || s.duration_sec !== null;
  if (isLogged) throw new Error("Cannot delete a logged set. Clear it first.");

  const { error: delErr } = await supabase.from("sets").delete().eq("vault_id", vaultId).eq("id", setId);
  if (delErr) throw new Error(delErr.message);

  revalidatePath(`/v/${vaultId}/sessions/${sessionId}`);
}


export async function setStartAtFromForm(
  vaultId: string,
  sessionId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const t = await getSessionTimes(supabase, vaultId, sessionId);

  const raw = String(formData.get("started_at") ?? "");
  if (!raw) throw new Error("Missing started_at");

  // raw is "YYYY-MM-DDTHH:mm" (datetime-local). Interpreted as local time.
  const iso = new Date(raw).toISOString();

  const patch: { started_at: string; finished_at?: string } = { started_at: iso };

  // preserve CHECK (finished_at >= started_at)
  if (t.finished_at) {
    const fin = new Date(t.finished_at).getTime();
    const start = new Date(iso).getTime();
    if (fin < start) patch.finished_at = iso;
  }

  await updateSessionTimes(supabase, vaultId, sessionId, patch);
  revalidatePath(`/v/${vaultId}/sessions/${sessionId}`);
}

export async function setFinishAtFromForm(
  vaultId: string,
  sessionId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const t = await getSessionTimes(supabase, vaultId, sessionId);

  const raw = String(formData.get("finished_at") ?? "");
  if (!raw) throw new Error("Missing finished_at");

  const iso = new Date(raw).toISOString();

  const patch: { finished_at: string; started_at?: string } = { finished_at: iso };

  // preserve CHECK (finished_at >= started_at)
  if (t.started_at) {
    const start = new Date(t.started_at).getTime();
    const fin = new Date(iso).getTime();
    if (start > fin) patch.started_at = iso;
  }

  await updateSessionTimes(supabase, vaultId, sessionId, patch);
  revalidatePath(`/v/${vaultId}/sessions/${sessionId}`);
}


const APP_TZ = "Australia/Sydney";

function partsFromTz(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    y: Number(get("year")),
    mo: Number(get("month")),
    d: Number(get("day")),
    h: Number(get("hour")),
    mi: Number(get("minute")),
    s: Number(get("second")),
  };
}

function tzOffsetMinutes(utcDate: Date, timeZone: string) {
  const p = partsFromTz(utcDate, timeZone);
  const asIfUtcMs = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s);
  return (asIfUtcMs - utcDate.getTime()) / 60000;
}

/**
 * Convert local (YYYY-MM-DD + HH:mm) in a named TZ to a UTC ISO string.
 * Handles DST via a 2-pass offset resolution.
 */
function localDateTimeToUtcIso(dateYmd: string, timeHm: string, timeZone = APP_TZ) {
  const [Y, M, D] = dateYmd.split("-").map(Number);
  const [h, mi] = timeHm.split(":").map(Number);

  const naiveUtc = new Date(Date.UTC(Y, M - 1, D, h, mi, 0));
  const off1 = tzOffsetMinutes(naiveUtc, timeZone);
  let utc = new Date(naiveUtc.getTime() - off1 * 60000);

  const off2 = tzOffsetMinutes(utc, timeZone);
  if (off2 !== off1) {
    utc = new Date(naiveUtc.getTime() - off2 * 60000);
  }

  return utc.toISOString();
}

export async function setStartTimeFromForm(
  vaultId: string,
  sessionId: string,
  sessionDayYmd: string,
  formData: FormData
) {
  const t = (formData.get("started_time") as string | null)?.trim();
  if (!t) return;

  const startedIso = localDateTimeToUtcIso(sessionDayYmd, t, APP_TZ);

  const supabase = await createClient();

  // Read current finished_at so we can avoid time_order constraint violations
  const { data: sess, error: readErr } = await supabase
    .from("workout_sessions")
    .select("finished_at")
    .eq("vault_id", vaultId)
    .eq("id", sessionId)
    .single();

  if (readErr) throw new Error(readErr.message);

  const finishedAt = sess?.finished_at as string | null;

  // If new start is after existing end, clear end (or throw if you prefer)
  const willInvert =
    finishedAt !== null &&
    new Date(startedIso).getTime() > new Date(finishedAt).getTime();

  const updatePatch = willInvert
    ? { started_at: startedIso, finished_at: null }
    : { started_at: startedIso };

  const { error } = await supabase
    .from("workout_sessions")
    .update(updatePatch)
    .eq("vault_id", vaultId)
    .eq("id", sessionId);

  if (error) throw new Error(error.message);

  revalidatePath(`/v/${vaultId}/sessions/${sessionId}`);
}

export async function setFinishTimeFromForm(
  vaultId: string,
  sessionId: string,
  sessionDayYmd: string,
  formData: FormData
) {
  const t = (formData.get("finished_time") as string | null)?.trim();
  if (!t) return;

  const finishedIso = localDateTimeToUtcIso(sessionDayYmd, t, APP_TZ);

  const supabase = await createClient();

  // Optional sanity: prevent end < start (same fixed day).
  const { data: sess, error: readErr } = await supabase
    .from("workout_sessions")
    .select("started_at")
    .eq("vault_id", vaultId)
    .eq("id", sessionId)
    .single();

  if (readErr) throw new Error(readErr.message);
  if (sess?.started_at && new Date(finishedIso).getTime() < new Date(sess.started_at).getTime()) {
    throw new Error("End time cannot be earlier than start time (fixed session day).");
  }

  const { error } = await supabase
    .from("workout_sessions")
    .update({ finished_at: finishedIso })
    .eq("vault_id", vaultId)
    .eq("id", sessionId);

  if (error) throw new Error(error.message);
  revalidatePath(`/v/${vaultId}/sessions/${sessionId}`);
}

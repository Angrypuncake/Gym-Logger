"use server";

import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/types/supabase";

export async function saveSet(
  vaultId: string,
  sessionId: string,
  formData: FormData
) {
  const setId = String(formData.get("set_id") || "");
  const repsRaw = formData.get("reps");
  const weightRaw = formData.get("weight_kg");
  const durRaw = formData.get("duration_sec");

  const reps = repsRaw === null || repsRaw === "" ? null : Number(repsRaw);
  const weight_kg = weightRaw === null || weightRaw === "" ? null : Number(weightRaw);
  const duration_sec = durRaw === null || durRaw === "" ? null : Number(durRaw);

  if (!setId) return;

  const supabase = await createClient();

  // Ensure this set belongs to this vault + session (prevents cross-vault/session writes)
  const { data: owner, error: ownerErr } = await supabase
    .from("sets")
    .select("id, workout_entries!inner(session_id)")
    .eq("id", setId)
    .eq("vault_id", vaultId)
    .eq("workout_entries.session_id", sessionId)
    .maybeSingle();

  if (ownerErr) throw new Error(ownerErr.message);
  if (!owner) throw new Error("Set not found for this session.");

  const { error } = await supabase
    .from("sets")
    .update({ reps, weight_kg, duration_sec })
    .eq("id", setId)
    .eq("vault_id", vaultId);

  if (error) throw new Error(error.message);
}

export async function addExerciseToSession(
  vaultId: string,
  sessionId: string,
  formData: FormData
) {
  const exerciseId = String(formData.get("exercise_id") || "").trim();
  if (!exerciseId) return;

  const supabase = await createClient();

  // Validate session belongs to vault
  const { data: session, error: sErr } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("vault_id", vaultId)
    .single();

  if (sErr) throw new Error(sErr.message);
  if (!session) throw new Error("Session not found.");

  // Find next order index
  const { data: lastEntry } = await supabase
    .from("workout_entries")
    .select("order")
    .eq("vault_id", vaultId)
    .eq("session_id", sessionId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (lastEntry?.order ?? 0) + 1;

  // Insert entry
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

  // Add 3 planned sets by default
  const setsPayload: TablesInsert<"sets">[] = [1, 2, 3].map((i) => ({
    vault_id: vaultId,
    entry_id: entry.id,
    set_index: i,
  }));

  const { error: setsErr } = await supabase.from("sets").insert(setsPayload);
  if (setsErr) throw new Error(setsErr.message);
}

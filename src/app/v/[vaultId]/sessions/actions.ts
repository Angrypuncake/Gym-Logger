"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type PrType = "REPS_MAX_WEIGHT" | "REPS_MAX_REPS" | "ISO_MAX_DURATION";

async function ensureQuickLogTemplate(supabase: any, vaultId: string) {
  const { data: existing, error } = await supabase
    .from("templates")
    .select("id")
    .eq("vault_id", vaultId)
    .eq("name", "Quick Log")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (existing?.id) return existing.id as string;

  const { data: tpl, error: insErr } = await supabase
    .from("templates")
    .insert({ vault_id: vaultId, name: "Quick Log", order: 9999 })
    .select("id")
    .single();

  if (insErr) throw new Error(insErr.message);
  return tpl.id as string;
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

export async function quickLogSet(vaultId: string, formData: FormData) {
  const day = String(formData.get("day") || "").trim(); // YYYY-MM-DD
  const exerciseId = String(formData.get("exercise_id") || "").trim();

  const repsRaw = formData.get("reps");
  const weightRaw = formData.get("weight_kg");
  const durRaw = formData.get("duration_sec");

  const reps = repsRaw === null || repsRaw === "" ? null : Number(repsRaw);
  const weightKg = weightRaw === null || weightRaw === "" ? null : Number(weightRaw);
  const durationSec = durRaw === null || durRaw === "" ? null : Number(durRaw);

  if (!day) throw new Error("day required");
  if (!exerciseId) throw new Error("exercise_id required");

  const supabase = await createClient();

  // Find existing in-progress session on that day
  const { data: existingSession, error: sFindErr } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("vault_id", vaultId)
    .eq("session_date", day)
    .is("finished_at", null)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sFindErr) throw new Error(sFindErr.message);

  let sessionId = existingSession?.id as string | undefined;

  if (!sessionId) {
    const quickTplId = await ensureQuickLogTemplate(supabase, vaultId);

    const { data: created, error: sCreateErr } = await supabase
      .from("workout_sessions")
      .insert({
        vault_id: vaultId,
        template_id: quickTplId,
        planned_template_id: quickTplId,
        date: new Date().toISOString(),
        session_date: day,
        finished_at: null,
      })
      .select("id")
      .single();

    if (sCreateErr) throw new Error(sCreateErr.message);
    sessionId = created.id as string;
  }

  // Reuse or create entry for that exercise
  const { data: existingEntry, error: eFindErr } = await supabase
    .from("workout_entries")
    .select("id,order")
    .eq("vault_id", vaultId)
    .eq("session_id", sessionId)
    .eq("exercise_id", exerciseId)
    .maybeSingle();

  if (eFindErr) throw new Error(eFindErr.message);

  let entryId = existingEntry?.id as string | undefined;

  if (!entryId) {
    const { data: lastEntry } = await supabase
      .from("workout_entries")
      .select("order")
      .eq("vault_id", vaultId)
      .eq("session_id", sessionId)
      .order("order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (lastEntry?.order ?? 0) + 1;

    const { data: createdEntry, error: eCreateErr } = await supabase
      .from("workout_entries")
      .insert({ vault_id: vaultId, session_id: sessionId, exercise_id: exerciseId, order: nextOrder })
      .select("id")
      .single();

    if (eCreateErr) throw new Error(eCreateErr.message);
    entryId = createdEntry.id as string;
  }

  // Next set_index
  const { data: lastSet, error: lastErr } = await supabase
    .from("sets")
    .select("set_index")
    .eq("vault_id", vaultId)
    .eq("entry_id", entryId)
    .order("set_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastErr) throw new Error(lastErr.message);

  const nextIndex = (lastSet?.set_index ?? 0) + 1;

  const { data: inserted, error: insErr } = await supabase
    .from("sets")
    .insert({
      vault_id: vaultId,
      entry_id: entryId,
      set_index: nextIndex,
      reps,
      weight_kg: weightKg,
      duration_sec: durationSec,
    })
    .select("id")
    .single();

  if (insErr) throw new Error(insErr.message);

  // PR detection (needs modality)
  const { data: ex, error: exErr } = await supabase
    .from("exercises")
    .select("modality")
    .eq("vault_id", vaultId)
    .eq("id", exerciseId)
    .single();

  if (exErr) throw new Error(exErr.message);

  await maybeRecordPr({
    supabase,
    vaultId,
    sessionId,
    setId: inserted.id as string,
    exerciseId,
    modality: ex.modality as "REPS" | "ISOMETRIC",
    reps,
    weightKg,
    durationSec,
  });

  revalidatePath(`/v/${vaultId}/sessions`);
  revalidatePath(`/v/${vaultId}/sessions/${sessionId}`);
  revalidatePath(`/v/${vaultId}`);
}

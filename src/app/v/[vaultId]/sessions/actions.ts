// src/app/v/[vaultId]/sessions/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSessionFromTemplate } from "./createSessionFromTemplate";

function asString(v: FormDataEntryValue | null) {
  if (v === null) return "";
  return String(v).trim();
}

type PrType = "REPS_MAX_WEIGHT" | "REPS_MAX_REPS" | "ISO_MAX_DURATION";

function parseNumberOrNull(v: FormDataEntryValue | null): number | null {
  if (v === null) return null;
  const s = String(v).trim();
  if (s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n)) throw new Error(`Invalid number: ${s}`);
  return n;
}

function parseIntOrNull(v: FormDataEntryValue | null): number | null {
  const n = parseNumberOrNull(v);
  if (n === null) return null;
  const i = Math.trunc(n);
  if (!Number.isFinite(i)) throw new Error("Invalid integer");
  return i;
}

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

    const nowIso = new Date().toISOString();

    const { error: upsertErr } = await supabase
      .from("exercise_prs")
      .upsert(
        {
          vault_id: vaultId,
          exercise_id: exerciseId,
          pr_type: c.pr_type,
          value: c.value,
          achieved_at: nowIso,
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
      achieved_at: nowIso,
      session_id: sessionId,
      set_id: setId,
    });

    if (evtErr) throw new Error(evtErr.message);
  }
}

export async function quickLogSet(vaultId: string, formData: FormData) {
  const day = String(formData.get("day") || "").trim(); // YYYY-MM-DD
  const exerciseId = String(formData.get("exercise_id") || "").trim();

  if (!day) throw new Error("day required");
  if (!exerciseId) throw new Error("exercise_id required");

  const reps = parseIntOrNull(formData.get("reps"));
  const weightKg = parseNumberOrNull(formData.get("weight_kg"));
  const durationSec = parseIntOrNull(formData.get("duration_sec"));

  const hasAny = reps !== null || weightKg !== null || durationSec !== null;
  if (!hasAny) throw new Error("Enter reps, weight, or duration");

  const supabase = await createClient();

  // Ensure Quick Log template exists and get its id
  const quickTplId = await ensureQuickLogTemplate(supabase, vaultId);

  // Find latest Quick Log session on that day (NOT based on finished_at)
  const { data: existingSession, error: sFindErr } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("vault_id", vaultId)
    .eq("session_date", day)
    .eq("template_id", quickTplId)
    .order("started_at", { ascending: false })
    .order("created_at", { ascending: false }) // renamed from "date"
    .limit(1)
    .maybeSingle();

  if (sFindErr) throw new Error(sFindErr.message);

  let sessionId = existingSession?.id as string | undefined;

  // If none, create a new Quick Log session for that day
  if (!sessionId) {
    const { data: created, error: sCreateErr } = await supabase
      .from("workout_sessions")
      .insert({
        vault_id: vaultId,
        template_id: quickTplId,
        planned_template_id: quickTplId,
        session_date: day,
        started_at: null,
        finished_at: null,
      })
      .select("id")
      .single();

    if (sCreateErr) throw new Error(sCreateErr.message);
    sessionId = created.id as string;
  }

  // Reuse latest entry for that exercise in this session (avoid maybeSingle multi-row error)
  const { data: existingEntry, error: eFindErr } = await supabase
    .from("workout_entries")
    .select("id,order")
    .eq("vault_id", vaultId)
    .eq("session_id", sessionId)
    .eq("exercise_id", exerciseId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (eFindErr) throw new Error(eFindErr.message);

  let entryId = existingEntry?.id as string | undefined;

  // If no entry yet, create one at the end
  if (!entryId) {
    const { data: lastEntry, error: lastEntryErr } = await supabase
      .from("workout_entries")
      .select("order")
      .eq("vault_id", vaultId)
      .eq("session_id", sessionId)
      .order("order", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastEntryErr) throw new Error(lastEntryErr.message);

    const nextOrder = (lastEntry?.order ?? -1) + 1; // 0-based

    const { data: createdEntry, error: eCreateErr } = await supabase
      .from("workout_entries")
      .insert({ vault_id: vaultId, session_id: sessionId, exercise_id: exerciseId, order: nextOrder })
      .select("id")
      .single();

    if (eCreateErr) throw new Error(eCreateErr.message);
    entryId = createdEntry.id as string;
  }

  // Next set_index (0-based)
  const { data: lastSet, error: lastErr } = await supabase
    .from("sets")
    .select("set_index")
    .eq("vault_id", vaultId)
    .eq("entry_id", entryId)
    .order("set_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastErr) throw new Error(lastErr.message);

  const nextIndex = (lastSet?.set_index ?? -1) + 1;

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
}

/**
 * Creates a session for a given day + template and redirects to the session logger.
 * Times are optional and editable later.
 */
export async function createSessionAction(vaultId: string, formData: FormData) {
  const templateId = asString(formData.get("template_id"));
  const sessionDate = asString(formData.get("session_date")); // YYYY-MM-DD

  // Optional: allow passing explicit timekeeping fields (ISO strings) from UI later
  const startedAtRaw = asString(formData.get("started_at"));
  const finishedAtRaw = asString(formData.get("finished_at"));

  const startedAt = startedAtRaw ? startedAtRaw : null;
  const finishedAt = finishedAtRaw ? finishedAtRaw : null;

  if (!templateId) throw new Error("template_id required");
  if (!sessionDate) throw new Error("session_date required");

  const { sessionId } = await createSessionFromTemplate({
    vaultId,
    templateId,
    sessionDate,
    startedAt,
    finishedAt,
    // Optional: choose your default when template_items.target_sets is null
    defaultTargetSets: 0,
  });

  revalidatePath(`/v/${vaultId}/sessions`);
  revalidatePath(`/v/${vaultId}/sessions/${sessionId}`);

  redirect(`/v/${vaultId}/sessions/${sessionId}`);
}
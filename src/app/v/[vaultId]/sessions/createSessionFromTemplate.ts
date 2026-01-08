// src/app/v/[vaultId]/sessions/createSessionFromTemplate.ts
import { createClient } from "@/lib/supabase/server";

type CreateSessionFromTemplateParams = {
  vaultId: string;
  templateId: string;
  sessionDate: string; // YYYY-MM-DD
  startedAt?: string | null;
  finishedAt?: string | null;
  notes?: string | null;
  rpe?: number | null;
  tags?: string[] | null;
  bodyWeightKg?: number | null;
  defaultTargetSets?: number;
};

export async function createSessionFromTemplate({
  vaultId,
  templateId,
  sessionDate,
  startedAt = null,
  finishedAt = null,
  notes = null,
  rpe = null,
  tags = null,
  bodyWeightKg = null,
  defaultTargetSets = 0,
}: CreateSessionFromTemplateParams): Promise<{ sessionId: string }> {
  const supabase = await createClient();

  // only for cleanup
  let createdSessionId: string | null = null;
  let entryIds: string[] = [];

  try {
    // 1) Create session
    const { data: session, error: sErr } = await supabase
      .from("workout_sessions")
      .insert({
        vault_id: vaultId,
        template_id: templateId,
        planned_template_id: templateId,
        session_date: sessionDate,
        started_at: startedAt,
        finished_at: finishedAt,
        notes,
        rpe,
        tags,
        body_weight_kg: bodyWeightKg,
      })
      .select("id")
      .single();

    if (sErr) throw new Error(sErr.message);
    if (!session?.id) throw new Error("Failed to create session (no id returned).");

    const sessionId = session.id;      // <- string (non-null)
    createdSessionId = sessionId;      // <- keep for cleanup

    // 2) Fetch template items (ordered)
    const { data: items, error: tErr } = await supabase
      .from("template_items")
      .select("exercise_id, sort_order, target_sets")
      .eq("vault_id", vaultId)
      .eq("template_id", templateId)
      .order("sort_order", { ascending: true });

    if (tErr) throw new Error(tErr.message);

    const templateItems = items ?? [];
    if (templateItems.length === 0) {
      return { sessionId };
    }

    // 3) Insert workout entries (session_id is now string)
    const entryRows = templateItems.map((it) => ({
      vault_id: vaultId,
      session_id: sessionId,
      exercise_id: it.exercise_id,
      sort_order: it.sort_order,
    }));

    const { data: entries, error: eErr } = await supabase
      .from("workout_entries")
      .insert(entryRows)
      .select("id, sort_order");

    if (eErr) throw new Error(eErr.message);

    const insertedEntries = entries ?? [];
    entryIds = insertedEntries.map((e) => e.id);

    const entryIdByOrder = new Map<number, string>();
    for (const e of insertedEntries) entryIdByOrder.set(e.sort_order, e.id);

    // 4) Seed planned sets
    const setRows: Array<{ vault_id: string; entry_id: string; set_index: number }> = [];

    for (const it of templateItems) {
      const entryId = entryIdByOrder.get(it.sort_order);
      if (!entryId) continue;

      const n = Math.max(0, (it.target_sets ?? defaultTargetSets) | 0);
      for (let i = 0; i < n; i++) {
        setRows.push({ vault_id: vaultId, entry_id: entryId, set_index: i });
      }
    }

    if (setRows.length > 0) {
      const { error: setErr } = await supabase.from("sets").insert(setRows);
      if (setErr) throw new Error(setErr.message);
    }

    return { sessionId };
  } catch (err) {
    // Best-effort cleanup
    try {
      if (entryIds.length > 0) {
        await supabase.from("sets").delete().eq("vault_id", vaultId).in("entry_id", entryIds);
        await supabase.from("workout_entries").delete().eq("vault_id", vaultId).in("id", entryIds);
      }
      if (createdSessionId) {
        await supabase
          .from("workout_sessions")
          .delete()
          .eq("vault_id", vaultId)
          .eq("id", createdSessionId);
      }
    } catch {
      // ignore cleanup failures
    }
    throw err;
  }
}

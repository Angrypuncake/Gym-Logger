// src/db/anatomy.ts
import { createClient } from "@/lib/supabase/server";
import type { Tables, TablesInsert, TablesUpdate, Enums } from "@/types/supabase";

export type AnatomicalTarget = Tables<"anatomical_targets">;
export type ExerciseTarget = Tables<"exercise_targets">;

export type AnatomicalTargetKind = Enums<"anatomical_target_kind">;
export type AnatomicalTargetRole = Enums<"anatomical_target_role">;

export type ExerciseTargetPick = {
  target_id: string;
  role?: AnatomicalTargetRole; // default handled in setExerciseTargets
};

export type ExerciseTargetWithTarget = {
  target_id: string;
  role: AnatomicalTargetRole;
  target: AnatomicalTarget;
};

function quoteUuidList(uuids: string[]) {
  // PostgREST expects something like: '("uuid1","uuid2")'
  const inner = uuids.map((id) => `"${id}"`).join(",");
  return `(${inner})`;
}

/* ----------------------------- Targets (catalog) ---------------------------- */

export async function listAnatomicalTargets(
  vaultId: string,
  opts?: { kind?: AnatomicalTargetKind }
): Promise<AnatomicalTarget[]> {
  const supabase = await createClient();

  let q = supabase
    .from("anatomical_targets")
    .select("*")
    .eq("vault_id", vaultId)
    .order("kind", { ascending: true })
    .order("name", { ascending: true });

  if (opts?.kind) q = q.eq("kind", opts.kind);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function getAnatomicalTargetBySlug(
  vaultId: string,
  slug: string
): Promise<AnatomicalTarget | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("anatomical_targets")
    .select("*")
    .eq("vault_id", vaultId)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function createAnatomicalTarget(
  vaultId: string,
  input: Omit<TablesInsert<"anatomical_targets">, "vault_id">
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("anatomical_targets")
    .insert({ ...input, vault_id: vaultId });

  if (error) throw new Error(error.message);
}

export async function updateAnatomicalTarget(
  vaultId: string,
  id: string,
  patch: TablesUpdate<"anatomical_targets">
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("anatomical_targets")
    .update(patch)
    .eq("id", id)
    .eq("vault_id", vaultId);

  if (error) throw new Error(error.message);
}

export async function deleteAnatomicalTarget(vaultId: string, id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("anatomical_targets")
    .delete()
    .eq("id", id)
    .eq("vault_id", vaultId);

  if (error) throw new Error(error.message);
}

/* --------------------------- Exercise ↔ Targets ---------------------------- */

export async function listExerciseTargets(
  vaultId: string,
  exerciseId: string
): Promise<ExerciseTargetWithTarget[]> {
  const supabase = await createClient();

  // NOTE: This relies on the FK relationship from exercise_targets.target_id -> anatomical_targets.id
  // PostgREST should expose it under the related table name "anatomical_targets".
  const { data, error } = await supabase
    .from("exercise_targets")
    .select(
      `
      target_id,
      role,
      anatomical_targets (
        id,
        vault_id,
        kind,
        name,
        slug,
        parent_id,
        created_at
      )
    `
    )
    .eq("vault_id", vaultId)
    .eq("exercise_id", exerciseId);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Array<{
    target_id: string;
    role: AnatomicalTargetRole;
    anatomical_targets: AnatomicalTarget | null;
  }>;

  // Filter any unexpected null join rows (shouldn't happen if FK is valid)
  const out: ExerciseTargetWithTarget[] = rows
    .filter((r) => r.anatomical_targets)
    .map((r) => ({
      target_id: r.target_id,
      role: r.role,
      target: r.anatomical_targets as AnatomicalTarget,
    }))
    .sort((a, b) => a.target.name.localeCompare(b.target.name));

  return out;
}

export async function addExerciseTarget(
  vaultId: string,
  exerciseId: string,
  targetId: string,
  role: AnatomicalTargetRole = "SECONDARY"
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("exercise_targets")
    .upsert(
      [
        {
          vault_id: vaultId,
          exercise_id: exerciseId,
          target_id: targetId,
          role,
        },
      ],
      { onConflict: "exercise_id,target_id" }
    );

  if (error) throw new Error(error.message);
}

export async function removeExerciseTarget(vaultId: string, exerciseId: string, targetId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("exercise_targets")
    .delete()
    .eq("vault_id", vaultId)
    .eq("exercise_id", exerciseId)
    .eq("target_id", targetId);

  if (error) throw new Error(error.message);
}

export async function clearExerciseTargets(vaultId: string, exerciseId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("exercise_targets")
    .delete()
    .eq("vault_id", vaultId)
    .eq("exercise_id", exerciseId);

  if (error) throw new Error(error.message);
}

/**
 * Replace-all semantics, but implemented safely:
 * 1) upsert desired rows (so failure doesn't wipe existing)
 * 2) delete any rows not in desired set
 */
export async function setExerciseTargets(
  vaultId: string,
  exerciseId: string,
  picks: ExerciseTargetPick[]
) {
  const supabase = await createClient();

  // Deduplicate by target_id; last role wins.
  const map = new Map<string, AnatomicalTargetRole>();
  for (const p of picks) {
    if (!p?.target_id) continue;
    map.set(p.target_id, (p.role ?? "SECONDARY") as AnatomicalTargetRole);
  }

  const targetIds = [...map.keys()];

  // If empty: delete all links
  if (targetIds.length === 0) {
    const { error } = await supabase
      .from("exercise_targets")
      .delete()
      .eq("vault_id", vaultId)
      .eq("exercise_id", exerciseId);

    if (error) throw new Error(error.message);
    return;
  }

  // 1) Upsert desired
  const upsertRows: TablesInsert<"exercise_targets">[] = targetIds.map((tid) => ({
    vault_id: vaultId,
    exercise_id: exerciseId,
    target_id: tid,
    role: map.get(tid)!,
  }));

  const { error: upsertErr } = await supabase
    .from("exercise_targets")
    .upsert(upsertRows, { onConflict: "exercise_id,target_id" });

  if (upsertErr) throw new Error(upsertErr.message);

  // 2) Delete extras not in desired set
  const notIn = quoteUuidList(targetIds);
  const { error: delErr } = await supabase
    .from("exercise_targets")
    .delete()
    .eq("vault_id", vaultId)
    .eq("exercise_id", exerciseId)
    .not("target_id", "in", notIn);

  if (delErr) throw new Error(delErr.message);
}

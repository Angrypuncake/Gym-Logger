import { createClient } from "@/lib/supabase/server";
import type { Tables, TablesInsert, TablesUpdate, Enums } from "@/types/supabase";

export type Exercise = Tables<"exercises">;
export type Modality = Enums<"modality">;

// Assumes exercises has: archived_at timestamptz null
export async function listExercises(vaultId: string): Promise<Exercise[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("vault_id", vaultId)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listActiveExercises(vaultId: string): Promise<Exercise[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("vault_id", vaultId)
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createExercise(
  vaultId: string,
  input: Omit<TablesInsert<"exercises">, "vault_id">
) {
  const supabase = await createClient();
  const { error } = await supabase.from("exercises").insert({ ...input, vault_id: vaultId });
  if (error) throw new Error(error.message);
}

export async function updateExercise(vaultId: string, id: string, patch: TablesUpdate<"exercises">) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("exercises")
    .update(patch)
    .eq("id", id)
    .eq("vault_id", vaultId);

  if (error) throw new Error(error.message);
}

export async function archiveExercise(vaultId: string, id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("exercises")
    .update({ archived_at: new Date().toISOString() } as TablesUpdate<"exercises">)
    .eq("id", id)
    .eq("vault_id", vaultId);

  if (error) throw new Error(error.message);
}

export async function unarchiveExercise(vaultId: string, id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("exercises")
    .update({ archived_at: null } as TablesUpdate<"exercises">)
    .eq("id", id)
    .eq("vault_id", vaultId);

  if (error) throw new Error(error.message);
}

/**
 * Optional: keep hard delete, but only if unused.
 * Prefer to not expose this in UI.
 */
export async function deleteExerciseHard(vaultId: string, id: string) {
  const usage = await getExerciseUsage(vaultId, id);

  if (usage.total > 0) {
    throw new Error(
      `Cannot delete: used in ${usage.workoutCount} workouts, ` +
        `${usage.templateCount} templates, ${usage.targetCount} target mappings, ` +
        `${usage.prCount} PRs. Archive instead.`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("exercises").delete().eq("id", id).eq("vault_id", vaultId);

  if (error) throw new Error(error.message);
}

export async function getExerciseUsage(vaultId: string, exerciseId: string) {
  const supabase = await createClient();

  // NOTE: exercise_targets likely does NOT have vault_id in your schema.
  // If so, remove the vault_id filter for that table.
  const [workouts, templates, targets, prs] = await Promise.all([
    supabase
      .from("workout_entries")
      .select("*", { count: "exact", head: true })
      .eq("vault_id", vaultId)
      .eq("exercise_id", exerciseId),

    supabase
      .from("template_items")
      .select("*", { count: "exact", head: true })
      .eq("vault_id", vaultId)
      .eq("exercise_id", exerciseId),

    supabase
      .from("exercise_targets")
      .select("*", { count: "exact", head: true })
      .eq("exercise_id", exerciseId),

    supabase
      .from("exercise_prs")
      .select("*", { count: "exact", head: true })
      .eq("vault_id", vaultId)
      .eq("exercise_id", exerciseId),
  ]);

  const err = workouts.error || templates.error || targets.error || prs.error;
  if (err) throw new Error(err.message);

  return {
    workoutCount: workouts.count ?? 0,
    templateCount: templates.count ?? 0,
    targetCount: targets.count ?? 0,
    prCount: prs.count ?? 0,
    total:
      (workouts.count ?? 0) +
      (templates.count ?? 0) +
      (targets.count ?? 0) +
      (prs.count ?? 0),
  };
}

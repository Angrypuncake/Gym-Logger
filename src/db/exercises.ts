// src/db/exercises.ts
import { createClient } from "@/lib/supabase/server";
import type { Tables, TablesInsert, TablesUpdate, Enums } from "@/types/supabase";

export type Exercise = Tables<"exercises">;
export type Modality = Enums<"modality">;

export type ListExercisesPageOpts = {
  page?: number; // 1-based
  pageSize?: number; // e.g. 50
  includeArchived?: boolean; // true = include both active+archived
  q?: string; // search query
};

export type ExercisesPageResult = {
  rows: Exercise[];
  total: number;
  page: number;
  pageSize: number;
};



// Existing (kept for other callers)
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

// Existing (kept for other callers)
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

// New: server-side search + pagination (offset-based via range)
export async function listExercisesPage(
  vaultId: string,
  opts: ListExercisesPageOpts = {}
): Promise<ExercisesPageResult> {
  const supabase = await createClient();

  const pageSize = Math.max(1, Math.min(200, opts.pageSize ?? 50));
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("exercises")
    .select("*", { count: "exact" })
    .eq("vault_id", vaultId);

  if (!opts.includeArchived) query = query.is("archived_at", null);

  const q = (opts.q ?? "").trim();
  if (q) query = query.ilike("name", `%${q}%`);

  const { data, count, error } = await query.order("name", { ascending: true }).range(from, to);

  if (error) throw new Error(error.message);

  return {
    rows: (data ?? []) as Exercise[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

// New: fetch the selected exercise even if it’s not on the current page
export async function getExerciseById(vaultId: string, id: string): Promise<Exercise | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("vault_id", vaultId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data ?? null) as Exercise | null;
}

export async function createExercise(
  vaultId: string,
  input: Omit<TablesInsert<"exercises">, "vault_id">
) {
  const supabase = await createClient();
  const { error } = await supabase.from("exercises").insert({ ...input, vault_id: vaultId });
  if (error) throw new Error(error.message);
}


export async function updateExercise(
  vaultId: string,
  id: string,
  patch: Omit<TablesUpdate<"exercises">, "vault_id">
) {
  const supabase = await createClient();

  const { error, count } = await supabase
    .from("exercises")
    .update(patch, { count: "exact" })
    .eq("id", id)
    .eq("vault_id", vaultId);

  if (error) throw new Error(error.message);
  if (count === 0) throw new Error("Exercise not found in this vault.");
}

export async function deleteExercise(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("exercises").delete().eq("id", id);
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

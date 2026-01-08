// src/db/anatomy.ts
import { createClient } from "@/lib/supabase/server";
import type { Tables, TablesInsert, TablesUpdate, Enums } from "@/types/supabase";

export type AnatomicalTarget = Tables<"anatomical_targets">;
export type ExerciseTarget = Tables<"exercise_targets">;

export type AnatomicalTargetKind = Enums<"anatomical_target_kind">;
export type AnatomicalTargetRole = Enums<"anatomical_target_role">;

export type ExerciseTargetPick = {
  target_id: string;
  role?: AnatomicalTargetRole;
};

export type ExerciseTargetWithTarget = {
  target_id: string;
  role: AnatomicalTargetRole;
  target: AnatomicalTarget;
};

function quoteUuidList(uuids: string[]) {
  const inner = uuids.map((id) => `"${id}"`).join(",");
  return `(${inner})`;
}

/* ----------------------------- Targets (global) ---------------------------- */

export async function listAnatomicalTargets(opts?: {
  kind?: AnatomicalTargetKind;
}): Promise<AnatomicalTarget[]> {
  const supabase = await createClient();

  let q = supabase
    .from("anatomical_targets")
    .select("*")
    .order("kind", { ascending: true })
    .order("name", { ascending: true });

  if (opts?.kind) q = q.eq("kind", opts.kind);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getAnatomicalTargetBySlug(slug: string): Promise<AnatomicalTarget | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("anatomical_targets")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function createAnatomicalTarget(input: TablesInsert<"anatomical_targets">) {
  const supabase = await createClient();
  const { error } = await supabase.from("anatomical_targets").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateAnatomicalTarget(id: string, patch: TablesUpdate<"anatomical_targets">) {
  const supabase = await createClient();
  const { error } = await supabase.from("anatomical_targets").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteAnatomicalTarget(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("anatomical_targets").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* --------------------------- Exercise ↔ Targets ---------------------------- */
export async function listExerciseTargets(exerciseId: string): Promise<ExerciseTargetWithTarget[]> {
    const supabase = await createClient();
  
    const { data, error } = await supabase
      .from("exercise_targets")
      .select(
        `
        target_id,
        role,
        anatomical_targets (
          id,
          kind,
          name,
          slug,
          parent_id,
          created_at
        )
      `
      )
      .eq("exercise_id", exerciseId);
  
    if (error) throw new Error(error.message);
  
    const rows = (data ?? []) as Array<{
      target_id: string;
      role: AnatomicalTargetRole;
      anatomical_targets: AnatomicalTarget | null;
    }>;
  
    return rows
      .filter((r) => r.anatomical_targets)
      .map((r) => ({
        target_id: r.target_id,
        role: r.role,
        target: r.anatomical_targets as AnatomicalTarget,
      }))
      .sort((a, b) => a.target.name.localeCompare(b.target.name));
  }


  
  export async function setExerciseTargets(vaultId: string, exerciseId: string, picks: ExerciseTargetPick[]) {
    const supabase = await createClient();
  
    const map = new Map<string, AnatomicalTargetRole>();
    for (const p of picks) {
      if (!p?.target_id) continue;
      map.set(p.target_id, (p.role ?? "SECONDARY") as AnatomicalTargetRole);
    }
  
    const targetIds = [...map.keys()];
  
    if (targetIds.length === 0) {
      const { error } = await supabase
        .from("exercise_targets")
        .delete()
        .eq("vault_id", vaultId)
        .eq("exercise_id", exerciseId);
      if (error) throw new Error(error.message);
      return;
    }
  
    const upsertRows = targetIds.map((tid) => ({
      vault_id: vaultId,
      exercise_id: exerciseId,
      target_id: tid,
      role: map.get(tid)!,
    }));
  
    const { error: upsertErr } = await supabase
      .from("exercise_targets")
      .upsert(upsertRows, { onConflict: "exercise_id,target_id" });
  
    if (upsertErr) throw new Error(upsertErr.message);
  
    const notIn = quoteUuidList(targetIds);
    const { error: delErr } = await supabase
      .from("exercise_targets")
      .delete()
      .eq("vault_id", vaultId)
      .eq("exercise_id", exerciseId)
      .not("target_id", "in", notIn);
  
    if (delErr) throw new Error(delErr.message);
  }

  export async function listPrimaryMuscleGroupsForExercises(
    vaultId: string,
    exerciseIds: string[]
  ): Promise<Map<string, string>> {
    const supabase = await createClient();
  
    if (exerciseIds.length === 0) return new Map();
  
    const { data, error } = await supabase
      .from("exercise_targets")
      .select("exercise_id, anatomical_targets(name)")
      .eq("vault_id", vaultId)
      .eq("role", "PRIMARY")
      .in("exercise_id", exerciseIds);
  
    if (error) throw new Error(error.message);
  
    const out = new Map<string, string>();
    for (const row of (data ?? []) as any[]) {
      const name = row.anatomical_targets?.name as string | undefined;
      if (!name) continue;
  
      // if you ever accidentally have >1 PRIMARY per exercise, first one wins
      if (!out.has(row.exercise_id)) out.set(row.exercise_id, name);
    }
  
    return out;
  }

  export type TendonExposureWithTarget = {
    tendon_target_id: string;
    modality: Enums<"modality"> | null; 
    confidence: string;
    target: AnatomicalTarget;
  };


  export async function listExerciseTendonExposure(exerciseId: string): Promise<TendonExposureWithTarget[]> {
    const supabase = await createClient();
  
    const { data, error } = await supabase
      .from("exercise_tendon_exposure")
      .select(`
        tendon_target_id,
        modality,
        confidence,
        anatomical_targets (
          id, kind, name, slug, parent_id, created_at, vault_id
        )
      `)
      .eq("exercise_id", exerciseId);
  
    if (error) throw new Error(error.message);
  
    const rows = (data ?? []) as any[];
    return rows
      .filter((r) => r.anatomical_targets)
      .map((r) => ({
        tendon_target_id: r.tendon_target_id,
        modality: r.modality ?? null,
        confidence: r.confidence ?? "HIGH",
        target: r.anatomical_targets as AnatomicalTarget,
      }))
      .sort((a, b) => a.target.name.localeCompare(b.target.name));
  }
  
  export async function listTendonExposureForExercises(
    vaultId: string,
    exerciseIds: string[]
  ): Promise<Map<string, TendonExposureWithTarget[]>> {
    const supabase = await createClient();
    if (exerciseIds.length === 0) return new Map();
  
    const { data, error } = await supabase
      .from("exercise_tendon_exposure")
      .select(`
        exercise_id,
        tendon_target_id,
        modality,
        confidence,
        anatomical_targets (
          id, kind, name, slug, parent_id, created_at, vault_id
        )
      `)
      .eq("vault_id", vaultId)
      .in("exercise_id", exerciseIds);
  
    if (error) throw new Error(error.message);
  
    const out = new Map<string, TendonExposureWithTarget[]>();
    for (const r of (data ?? []) as any[]) {
      if (!r.anatomical_targets) continue;
      const item: TendonExposureWithTarget = {
        tendon_target_id: r.tendon_target_id,
        modality: r.modality ?? null,
        confidence: r.confidence ?? "HIGH",
        target: r.anatomical_targets as AnatomicalTarget,
      };
      const arr = out.get(r.exercise_id) ?? [];
      arr.push(item);
      out.set(r.exercise_id, arr);
    }
  
    // optional: sort each list by tendon name
    for (const [k, arr] of out) arr.sort((a, b) => a.target.name.localeCompare(b.target.name));
    return out;
  }

  export type TendonExposureRow = {
    tendon_target_id: string;
    anatomical_targets: { id: string; name: string; slug: string } | null;
  };
  
  export async function listExerciseTendons(exerciseId: string) {
    const supabase = await createClient();
  
    const { data, error } = await supabase
      .from("exercise_tendon_exposure")
      .select(
        `
        tendon_target_id,
        anatomical_targets (
          id,
          name,
          slug
        )
      `
      )
      .eq("exercise_id", exerciseId);
  
    if (error) throw new Error(error.message);
  
    const rows = (data ?? []) as TendonExposureRow[];
    return rows
      .filter((r) => r.anatomical_targets)
      .map((r) => r.anatomical_targets!)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
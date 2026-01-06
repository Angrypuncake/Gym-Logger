import { createClient } from "@/lib/supabase/server";
import type { Tables, TablesInsert, TablesUpdate, Enums } from "@/types/supabase";

export type Exercise = Tables<"exercises">;
export type Modality = Enums<"modality">;

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

export async function createExercise(
  vaultId: string,
  input: Omit<TablesInsert<"exercises">, "vault_id">
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("exercises")
    .insert({ ...input, vault_id: vaultId });

  if (error) throw new Error(error.message);
}

export async function updateExercise(
  vaultId: string,
  id: string,
  patch: TablesUpdate<"exercises">
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("exercises")
    .update(patch)
    .eq("id", id)
    .eq("vault_id", vaultId);

  if (error) throw new Error(error.message);
}

export async function deleteExercise(vaultId: string, id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("exercises")
    .delete()
    .eq("id", id)
    .eq("vault_id", vaultId);

  if (error) throw new Error(error.message);
}

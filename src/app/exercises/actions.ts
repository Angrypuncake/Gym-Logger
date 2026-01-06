"use server";

import { createClient } from "@/lib/supabase/server";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";

export async function createExercise(input: TablesInsert<"exercises">) {
  const supabase = await createClient();
  const { error } = await supabase.from("exercises").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateExercise(id: string, patch: TablesUpdate<"exercises">) {
  const supabase = await createClient();
  const { error } = await supabase.from("exercises").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteExercise(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("exercises").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

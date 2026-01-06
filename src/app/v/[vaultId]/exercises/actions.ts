"use server";

import { createExercise, deleteExercise } from "@/db/exercises";
import type { Enums } from "@/types/supabase";

export async function addExercise(vaultId: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const modality = String(formData.get("modality") || "REPS") as Enums<"modality">;

  if (!name) return;

  await createExercise(vaultId, { name, modality });
}

export async function removeExercise(vaultId: string, id: string) {
  await deleteExercise(vaultId, id);
}

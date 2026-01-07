"use server";

import { createExercise, deleteExercise, updateExercise } from "@/db/exercises";
import type { Enums } from "@/types/supabase";
import { revalidatePath } from "next/cache";

export async function addExercise(vaultId: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const modality = String(formData.get("modality") || "REPS") as Enums<"modality">;

  if (!name) return;

  await createExercise(vaultId, { name, modality });

  revalidatePath(`/v/${vaultId}/exercises`);
}

export async function removeExercise(vaultId: string, id: string) {
  await deleteExercise(vaultId, id);

  revalidatePath(`/v/${vaultId}/exercises`);
}

export async function updateExerciseAction(
  vaultId: string,
  exerciseId: string,
  formData: FormData
) {
  const name = String(formData.get("name") ?? "").trim();
  const modality = String(formData.get("modality") ?? "REPS") as Enums<"modality">;
  const uses_bodyweight = formData.get("uses_bodyweight") === "on";

  if (!name) throw new Error("Name required");

  await updateExercise(vaultId, exerciseId, { name, modality, uses_bodyweight });

  // Always revalidate the manager page
  revalidatePath(`/v/${vaultId}/exercises`);

  // Optional: if Next ends up caching by searchParams separately in your setup,
  // you can also revalidate the "selected" variant:
  revalidatePath(`/v/${vaultId}/exercises?edit=${exerciseId}`);
}

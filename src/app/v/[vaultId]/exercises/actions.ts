"use server";

import {
  createExercise,
  updateExercise,
  archiveExercise,
  unarchiveExercise,
  deleteExerciseHard,
} from "@/db/exercises";
import type { Enums } from "@/types/supabase";
import { revalidatePath } from "next/cache";
import { setExerciseTargets } from "@/db/anatomy";

function revalidateExercise(vaultId: string) {
  revalidatePath(`/v/${vaultId}/exercises`);

}

export async function addExercise(vaultId: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const modality = String(formData.get("modality") || "REPS") as Enums<"modality">;
  if (!name) return;

  await createExercise(vaultId, { name, modality });
  revalidateExercise(vaultId);
}

export async function archiveExerciseAction(vaultId: string, id: string) {
  await archiveExercise(vaultId, id);
  revalidateExercise(vaultId);
}

export async function unarchiveExerciseAction(vaultId: string, id: string) {
  await unarchiveExercise(vaultId, id);
  revalidateExercise(vaultId);
}

export async function removeExercise(vaultId: string, id: string) {
  await deleteExerciseHard(vaultId, id);
  revalidateExercise(vaultId);
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

  revalidateExercise(vaultId);
  revalidatePath(`/v/${vaultId}/exercises?edit=${exerciseId}`);
}

type AnatomicalTargetRole = Enums<"anatomical_target_role">;

export async function updateExerciseTargetsAction(
  vaultId: string,
  exerciseId: string,
  formData: FormData
) {
  const targetIds = formData.getAll("target_id").map(String).filter(Boolean);

  const picks = targetIds.map((id) => {
    const role = formData.get(`role:${id}`) as AnatomicalTargetRole | null;
    return { target_id: id, role: (role ?? "SECONDARY") as AnatomicalTargetRole };
  });

  // enforce at most one PRIMARY
  let seenPrimary = false;
  for (const p of picks) {
    if (p.role === "PRIMARY") {
      if (seenPrimary) p.role = "SECONDARY";
      seenPrimary = true;
    }
  }

  await setExerciseTargets(vaultId, exerciseId, picks);

  revalidateExercise(vaultId);
  revalidatePath(`/v/${vaultId}/exercises?edit=${exerciseId}`);
}

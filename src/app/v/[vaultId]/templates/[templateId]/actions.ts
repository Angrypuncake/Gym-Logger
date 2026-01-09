"use server";

import type { Enums } from "@/types/supabase";
import { revalidatePath } from "next/cache";
import {
  renameTemplateDb,
  addTemplateItemExistingExerciseDb,
  createExerciseAndAddToTemplateDb,
  setTemplateItemTargetSetsDb,
  removeTemplateItemDb,
  moveTemplateItemDb,
} from "@/db/templates/index";

export async function renameTemplate(vaultId: string, templateId: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  await renameTemplateDb(vaultId, templateId, name);
  revalidatePath(`/v/${vaultId}/templates/${templateId}`);
}

export async function addExistingExercise(vaultId: string, templateId: string, formData: FormData) {
  const exerciseId = String(formData.get("exercise_id") || "").trim();
  if (!exerciseId) return;

  await addTemplateItemExistingExerciseDb(vaultId, templateId, exerciseId, { defaultTargetSets: 3 });
  revalidatePath(`/v/${vaultId}/templates/${templateId}`);
}

export async function createExerciseAndAdd(vaultId: string, templateId: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const modality = String(formData.get("modality") || "REPS") as Enums<"modality">;
  if (!name) return;

  await createExerciseAndAddToTemplateDb(vaultId, templateId, { name, modality, defaultTargetSets: 3 });
  revalidatePath(`/v/${vaultId}/templates/${templateId}`);
}

export async function setTargetSets(
  vaultId: string,
  templateId: string,
  templateItemId: string,
  formData: FormData
) {
  const raw = String(formData.get("target_sets") || "").trim();
  const target_sets = raw === "" ? null : Number(raw);

  if (target_sets !== null && (!Number.isFinite(target_sets) || target_sets < 1 || target_sets > 20)) {
    throw new Error("target_sets must be 1–20 (or blank).");
  }

  await setTemplateItemTargetSetsDb(vaultId, templateItemId, target_sets);
  revalidatePath(`/v/${vaultId}/templates/${templateId}`);
}

export async function removeTemplateItem(vaultId: string, templateId: string, templateItemId: string) {
  await removeTemplateItemDb(vaultId, templateItemId);
  revalidatePath(`/v/${vaultId}/templates/${templateId}`);
}

export async function moveItem(
  vaultId: string,
  templateId: string,
  templateItemId: string,
  direction: "up" | "down"
) {
  await moveTemplateItemDb(vaultId, templateId, templateItemId, direction);
  revalidatePath(`/v/${vaultId}/templates/${templateId}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseNullableInt, parseNullableNumber } from "@/lib/utils";
import {
  addExerciseToSessionDb,
  addSetToEntryDb,
  deleteUnloggedSetDb,
  discardWorkoutDb,
  removeExerciseFromSessionDb,
  saveSetDb,
  swapEntryOrderDb,
  updateBodyweightDb,
  updateSessionTimesDb,
} from "@/db/sessions/index";
import { clearStartTime, setFinishTimeFromForm, setStartTimeFromForm } from "@/db/sessiontimes";

function revalidateSession(vaultId: string, sessionId: string) {
  revalidatePath(`/v/${vaultId}`);
  revalidatePath(`/v/${vaultId}/sessions`);
  revalidatePath(`/v/${vaultId}/sessions/${sessionId}`);
}

export async function saveSetAction(
  vaultId: string,
  sessionId: string,
  formData: FormData
) {
  const setId = String(formData.get("set_id") || "").trim();
  if (!setId) return;

  const reps = parseNullableInt(formData.get("reps"), 1000);
  const durationSec = parseNullableInt(formData.get("duration_sec"), 60 * 60 * 4);
  const weightKg = parseNullableNumber(formData.get("weight_kg"), 2000);

  await saveSetDb({ vaultId, sessionId, setId, reps, durationSec, weightKg });
  revalidateSession(vaultId, sessionId);
}

export async function removeExerciseFromSessionAction(
  vaultId: string,
  sessionId: string,
  entryId: string
) {
  await removeExerciseFromSessionDb({ vaultId, sessionId, entryId });
  revalidateSession(vaultId, sessionId);
}

export async function addExerciseToSessionAction(
  vaultId: string,
  sessionId: string,
  formData: FormData
) {
  const exerciseId = String(formData.get("exercise_id") || "").trim();
  if (!exerciseId) return;

  await addExerciseToSessionDb({ vaultId, sessionId, exerciseId, seedSets: 3 });
  revalidateSession(vaultId, sessionId);
}

export async function addSetToEntryAction(
  vaultId: string,
  sessionId: string,
  entryId: string
) {
  await addSetToEntryDb({ vaultId, sessionId, entryId });
  revalidateSession(vaultId, sessionId);
}

export async function deleteUnloggedSetFromFormAction(
  vaultId: string,
  sessionId: string,
  formData: FormData
) {
  const setId = String(formData.get("set_id") ?? "").trim();
  if (!setId) throw new Error("Missing set_id");

  await deleteUnloggedSetDb({ vaultId, sessionId, setId });
  revalidateSession(vaultId, sessionId);
}

export async function updateBodyweightAction(
  vaultId: string,
  sessionId: string,
  formData: FormData
) {
  const raw = String(formData.get("body_weight_kg") ?? "").trim();
  const bodyWeightKg = raw === "" ? null : Number(raw);

  await updateBodyweightDb({ vaultId, sessionId, bodyWeightKg });
  revalidateSession(vaultId, sessionId);
}

export async function discardWorkoutAction(vaultId: string, sessionId: string) {
  await discardWorkoutDb({ vaultId, sessionId });
  revalidatePath(`/v/${vaultId}`);
  revalidatePath(`/v/${vaultId}/sessions`);
  redirect(`/v/${vaultId}`);
}

export async function updateSessionTimesAction(
  vaultId: string,
  sessionId: string,
  patch: { started_at?: string | null; finished_at?: string | null }
) {
  await updateSessionTimesDb({ vaultId, sessionId, patch });
  revalidateSession(vaultId, sessionId);
}

export async function clearFinishTimeAction(vaultId: string, sessionId: string) {
  await updateSessionTimesDb({ vaultId, sessionId, patch: { finished_at: null } });
  revalidateSession(vaultId, sessionId);
}

export async function swapEntryOrderAction(params: {
  vaultId: string;
  sessionId: string;
  entryId: string;
  direction: "UP" | "DOWN";
}) {
  await swapEntryOrderDb(params);
  revalidateSession(params.vaultId, params.sessionId);
}

export async function moveEntryUp(vaultId: string, sessionId: string, entryId: string) {
  await swapEntryOrderDb({ vaultId, sessionId, entryId, direction: "UP" });
  revalidateSession(vaultId, sessionId);
}

export async function moveEntryDown(vaultId: string, sessionId: string, entryId: string) {
  await swapEntryOrderDb({ vaultId, sessionId, entryId, direction: "DOWN" });
  revalidateSession(vaultId, sessionId);
}

export async function setFinishTimeFromFormAction(vaultId: string,
  sessionId: string,
  sessionDayYmd: string,
  formData: FormData)  {
    await setFinishTimeFromForm(vaultId, sessionId, sessionDayYmd, formData)
    revalidateSession(vaultId, sessionId);
  }
export async function clearStartTimeAction(vaultId: string, sessionId: string) {
  await clearStartTime(vaultId, sessionId)
  revalidateSession(vaultId, sessionId);
}
export async function setStartTimeFromFormAction(vaultId: string,
  sessionId: string,
  sessionDayYmd: string,
  formData: FormData) {
    await setStartTimeFromForm(vaultId, sessionId, sessionDayYmd, formData)
    revalidateSession(vaultId, sessionId);
  }
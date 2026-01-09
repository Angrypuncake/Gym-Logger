// src/app/v/[vaultId]/sessions/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSessionFromTemplate } from "./createSessionFromTemplate";

function asString(v: FormDataEntryValue | null) {
  if (v === null) return "";
  return String(v).trim();
}
/**
 * Creates a session for a given day + template and redirects to the session logger.
 * Times are optional and editable later.
 */
export async function createSessionAction(vaultId: string, formData: FormData) {
  const templateId = asString(formData.get("template_id"));
  const sessionDate = asString(formData.get("session_date")); // YYYY-MM-DD

  // Optional: allow passing explicit timekeeping fields (ISO strings) from UI later
  const startedAtRaw = asString(formData.get("started_at"));
  const finishedAtRaw = asString(formData.get("finished_at"));

  const startedAt = startedAtRaw ? startedAtRaw : null;
  const finishedAt = finishedAtRaw ? finishedAtRaw : null;

  if (!templateId) throw new Error("template_id required");
  if (!sessionDate) throw new Error("session_date required");

  const { sessionId } = await createSessionFromTemplate({
    vaultId,
    templateId,
    sessionDate,
    startedAt,
    finishedAt,
    // Optional: choose your default when template_items.target_sets is null
    defaultTargetSets: 0,
  });

  revalidatePath(`/v/${vaultId}/sessions`);
  revalidatePath(`/v/${vaultId}/sessions/${sessionId}`);

  redirect(`/v/${vaultId}/sessions/${sessionId}`);
}
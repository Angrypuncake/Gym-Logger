import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function updateSessionTimes(
  supabase: any,
  vaultId: string,
  sessionId: string,
  patch: { started_at?: string | null; finished_at?: string | null }
) {
  const { error } = await supabase
    .from("workout_sessions")
    .update(patch)
    .eq("vault_id", vaultId)
    .eq("id", sessionId);

  if (error) throw new Error(error.message);

  revalidatePath(`/v/${vaultId}/sessions`);
  revalidatePath(`/v/${vaultId}/sessions/${sessionId}`);
}


async function getSessionTimes(supabase: any, vaultId: string, sessionId: string) {
    const { data, error } = await supabase
      .from("workout_sessions")
      .select("started_at,finished_at")
      .eq("vault_id", vaultId)
      .eq("id", sessionId)
      .single();
  
    if (error) throw new Error(error.message);
    return data as { started_at: string | null; finished_at: string | null };
  }


export async function setStartAtFromForm(
  vaultId: string,
  sessionId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const t = await getSessionTimes(supabase, vaultId, sessionId);

  const raw = String(formData.get("started_at") ?? "");
  if (!raw) throw new Error("Missing started_at");

  // raw is "YYYY-MM-DDTHH:mm" (datetime-local). Interpreted as local time.
  const iso = new Date(raw).toISOString();

  const patch: { started_at: string; finished_at?: string } = { started_at: iso };

  // preserve CHECK (finished_at >= started_at)
  if (t.finished_at) {
    const fin = new Date(t.finished_at).getTime();
    const start = new Date(iso).getTime();
    if (fin < start) patch.finished_at = iso;
  }

  await updateSessionTimes(supabase, vaultId, sessionId, patch);
  revalidatePath(`/v/${vaultId}/sessions/${sessionId}`);
}

export async function setFinishAtFromForm(
  vaultId: string,
  sessionId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const t = await getSessionTimes(supabase, vaultId, sessionId);

  const raw = String(formData.get("finished_at") ?? "");
  if (!raw) throw new Error("Missing finished_at");

  const iso = new Date(raw).toISOString();

  const patch: { finished_at: string; started_at?: string } = { finished_at: iso };

  // preserve CHECK (finished_at >= started_at)
  if (t.started_at) {
    const start = new Date(t.started_at).getTime();
    const fin = new Date(iso).getTime();
    if (start > fin) patch.started_at = iso;
  }

  await updateSessionTimes(supabase, vaultId, sessionId, patch);
  revalidatePath(`/v/${vaultId}/sessions/${sessionId}`);
}


const APP_TZ = "Australia/Sydney";

function partsFromTz(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    y: Number(get("year")),
    mo: Number(get("month")),
    d: Number(get("day")),
    h: Number(get("hour")),
    mi: Number(get("minute")),
    s: Number(get("second")),
  };
}

function tzOffsetMinutes(utcDate: Date, timeZone: string) {
  const p = partsFromTz(utcDate, timeZone);
  const asIfUtcMs = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s);
  return (asIfUtcMs - utcDate.getTime()) / 60000;
}

/**
 * Convert local (YYYY-MM-DD + HH:mm) in a named TZ to a UTC ISO string.
 * Handles DST via a 2-pass offset resolution.
 */
function localDateTimeToUtcIso(dateYmd: string, timeHm: string, timeZone = APP_TZ) {
  const [Y, M, D] = dateYmd.split("-").map(Number);
  const [h, mi] = timeHm.split(":").map(Number);

  const naiveUtc = new Date(Date.UTC(Y, M - 1, D, h, mi, 0));
  const off1 = tzOffsetMinutes(naiveUtc, timeZone);
  let utc = new Date(naiveUtc.getTime() - off1 * 60000);

  const off2 = tzOffsetMinutes(utc, timeZone);
  if (off2 !== off1) {
    utc = new Date(naiveUtc.getTime() - off2 * 60000);
  }

  return utc.toISOString();
}

export async function setStartTimeFromForm(
  vaultId: string,
  sessionId: string,
  sessionDayYmd: string,
  formData: FormData
) {
  const t = (formData.get("started_time") as string | null)?.trim();
  if (!t) return;

  const startedIso = localDateTimeToUtcIso(sessionDayYmd, t, APP_TZ);

  const supabase = await createClient();

  // Read current finished_at so we can avoid time_order constraint violations
  const { data: sess, error: readErr } = await supabase
    .from("workout_sessions")
    .select("finished_at")
    .eq("vault_id", vaultId)
    .eq("id", sessionId)
    .single();

  if (readErr) throw new Error(readErr.message);

  const finishedAt = sess?.finished_at as string | null;

  // If new start is after existing end, clear end (or throw if you prefer)
  const willInvert =
    finishedAt !== null &&
    new Date(startedIso).getTime() > new Date(finishedAt).getTime();

  const updatePatch = willInvert
    ? { started_at: startedIso, finished_at: null }
    : { started_at: startedIso };

  const { error } = await supabase
    .from("workout_sessions")
    .update(updatePatch)
    .eq("vault_id", vaultId)
    .eq("id", sessionId);

  if (error) throw new Error(error.message);

  revalidatePath(`/v/${vaultId}/sessions/${sessionId}`);
}

export async function setFinishTimeFromForm(
  vaultId: string,
  sessionId: string,
  sessionDayYmd: string,
  formData: FormData
) {
  const t = (formData.get("finished_time") as string | null)?.trim();
  if (!t) return;

  const finishedIso = localDateTimeToUtcIso(sessionDayYmd, t, APP_TZ);

  const supabase = await createClient();

  // Optional sanity: prevent end < start (same fixed day).
  const { data: sess, error: readErr } = await supabase
    .from("workout_sessions")
    .select("started_at")
    .eq("vault_id", vaultId)
    .eq("id", sessionId)
    .single();

  if (readErr) throw new Error(readErr.message);
  if (sess?.started_at && new Date(finishedIso).getTime() < new Date(sess.started_at).getTime()) {
    throw new Error("End time cannot be earlier than start time (fixed session day).");
  }

  const { error } = await supabase
    .from("workout_sessions")
    .update({ finished_at: finishedIso })
    .eq("vault_id", vaultId)
    .eq("id", sessionId);

  if (error) throw new Error(error.message);
  revalidatePath(`/v/${vaultId}/sessions/${sessionId}`);
}


export async function clearStartTime(vaultId: string, sessionId: string) {
    const supabase = await createClient();
    await updateSessionTimes(supabase, vaultId, sessionId, { started_at: null });
  }
import { createClient } from "@/lib/supabase/server";
import { monthStartKey, monthEndKey, sydneyKey } from "@/lib/datesSydney";

function clampPct(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}
export async function getSessionProgressPct(vaultId: string, sessionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sets")
    .select("reps,duration_sec, workout_entries!inner(session_id)")
    .eq("vault_id", vaultId)
    .eq("workout_entries.session_id", sessionId);

  if (error) throw new Error(error.message);

  const total = data?.length ?? 0;
  const done =
    data?.filter((s) => s.reps !== null || s.duration_sec !== null).length ?? 0;

  return total === 0 ? 0 : clampPct((done / total) * 100);
}

export type SummaryRow = {
  session_id: string;
  vault_id: string;
  template_id: string;
  template_name: string;
  session_date: string; // YYYY-MM-DD
  started_at: string | null;
  finished_at: string | null;
  planned_sets: number;
  logged_sets: number;
  total_reps: number;
  total_iso_sec: number;
  modalities: string[];
  has_pr: boolean;
};

export type TemplateRow = { id: string; name: string; sort_order: number };

export async function getSessionSummariesForMonth(vaultId: string, year: number, month0: number) {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("session_summaries")
    .select("*")
    .eq("vault_id", vaultId)
    .gte("session_date", monthStartKey(year, month0))
    .lte("session_date", monthEndKey(year, month0))
    .order("session_date", { ascending: true })
    .order("started_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SummaryRow[];
}

export async function getTemplatesForVault(vaultId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("templates")
    .select("id,name,sort_order")
    .eq("vault_id", vaultId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as TemplateRow[];
}

export async function getTrainedDaysInRange(vaultId: string, since: Date, until: Date) {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("session_summaries")
    .select("session_date,logged_sets")
    .eq("vault_id", vaultId)
    .gte("session_date", sydneyKey(since))
    .lte("session_date", sydneyKey(until));

  if (error) throw new Error(error.message);

  const trained = new Set<string>(
    (data ?? [])
      .filter((r: any) => Number(r.logged_sets ?? 0) > 0)
      .map((r: any) => String(r.session_date))
  );

  return trained;
}
import { createClient } from "@/lib/supabase/server";

function clampPct(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function getCurrentSession(vaultId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("id,date,finished_at, template:templates!workout_sessions_template_fk(name)")
    .eq("vault_id", vaultId)
    .is("finished_at", null)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();


  if (error) throw new Error(error.message);
  return data;
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

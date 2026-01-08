import { createClient } from "@/lib/supabase/server";

export type MuscleWeeklyRow = {
  vault_id: string;
  target_id: string;
  target_name: string;
  week_start: string; // date
  role: string;
  set_count: number;
  total_reps: number;
  total_iso_sec: number;
  total_tonnage_kg: number | null;
  weighted_tonnage_kg?: number | null;
};

export type TendonWeeklyRow = {
    vault_id: string;
    target_id: string;
    target_name: string;
    week_start: string;
    set_count: number;
    total_reps: number;
    total_iso_sec: number;
    total_tonnage_kg: number | null;
    total_iso_load_kg_sec: number | null;
    avg_iso_load_kg: number | null;
  };
  
export async function fetchMuscleWeeklyMetrics(args: {
  vaultId: string;
  fromISO: string;
  toISO: string;
}): Promise<MuscleWeeklyRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("muscle_weekly_metrics")
    .select(
      "vault_id,target_id,target_name,week_start,role,set_count,total_reps,total_iso_sec,total_tonnage_kg,weighted_tonnage_kg"
    )
    .eq("vault_id", args.vaultId)
    .gte("week_start", args.fromISO)
    .lte("week_start", args.toISO);

  if (error) throw new Error(error.message);
  return (data ?? []) as MuscleWeeklyRow[];
}

export async function fetchTendonWeeklyMetrics(args: {
  vaultId: string;
  fromISO: string;
  toISO: string;
}): Promise<TendonWeeklyRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tendon_weekly_metrics")
    .select(
        "vault_id,target_id,target_name,week_start,set_count,total_reps,total_iso_sec,total_tonnage_kg,total_iso_load_kg_sec,avg_iso_load_kg"
      )
      
    .eq("vault_id", args.vaultId)
    .gte("week_start", args.fromISO)
    .lte("week_start", args.toISO);

  if (error) throw new Error(error.message);
  return (data ?? []) as TendonWeeklyRow[];
}

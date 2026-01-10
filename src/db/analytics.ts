// src/db/analytics.ts
import { createClient } from "@/lib/supabase/server";

export type Grain = "week" | "day";

/* ------------------------------ MUSCLES ------------------------------ */

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

export type MuscleDailyRow = Omit<MuscleWeeklyRow, "week_start"> & { day_start: string };

export async function fetchMuscleMetrics(args: {
  vaultId: string;
  fromISO: string;
  toISO: string;
  grain: Grain;
}): Promise<Array<MuscleWeeklyRow | MuscleDailyRow>> {
  const supabase = await createClient();

  const table = args.grain === "day" ? "muscle_daily_metrics" : "muscle_weekly_metrics";
  const periodCol = args.grain === "day" ? "day_start" : "week_start";

  const { data, error } = await supabase
    .from(table)
    .select(
      `vault_id,target_id,target_name,${periodCol},role,set_count,total_reps,total_iso_sec,total_tonnage_kg,weighted_tonnage_kg`
    )
    .eq("vault_id", args.vaultId)
    .gte(periodCol, args.fromISO)
    .lte(periodCol, args.toISO);

  if (error) throw new Error(error.message);
  return (data ?? []) as any;
}

/* ------------------------------ TENDONS ------------------------------ */
/**
 * Tendons simplified: track only isometric duration-load (kg·s).
 * Keep set_count + total_iso_sec as supporting fields (optional UI usage).
 */
export type TendonWeeklyRow = {
  vault_id: string;
  target_id: string;
  target_name: string;
  week_start: string; // date
  set_count: number;
  total_iso_sec: number;
  total_iso_load_kg_sec: number;
};

export type TendonDailyRow = Omit<TendonWeeklyRow, "week_start"> & { day_start: string };

export async function fetchTendonMetrics(args: {
  vaultId: string;
  fromISO: string;
  toISO: string;
  grain: Grain;
}): Promise<Array<TendonWeeklyRow | TendonDailyRow>> {
  const supabase = await createClient();

  const table = args.grain === "day" ? "tendon_daily_metrics" : "tendon_weekly_metrics";
  const periodCol = args.grain === "day" ? "day_start" : "week_start";

  const { data, error } = await supabase
    .from(table)
    .select(`vault_id,target_id,target_name,${periodCol},set_count,total_iso_sec,iso_exposure_kg_sec`)
    .eq("vault_id", args.vaultId)
    .gte(periodCol, args.fromISO)
    .lte(periodCol, args.toISO);

  if (error) throw new Error(error.message);
  return (data ?? []) as any;
}

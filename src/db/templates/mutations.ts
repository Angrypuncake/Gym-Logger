import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/supabase";

export async function renameTemplateDb(vaultId: string, templateId: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("templates")
    .update({ name })
    .eq("id", templateId)
    .eq("vault_id", vaultId);

  if (error) throw new Error(error.message);
}

export async function addTemplateItemExistingExerciseDb(
  vaultId: string,
  templateId: string,
  exerciseId: string,
  opts?: { defaultTargetSets?: number }
) {
  const defaultTargetSets = opts?.defaultTargetSets ?? 3;

  const supabase = await createClient();

  const { data: last, error: lastErr } = await supabase
    .from("template_items")
    .select("sort_order")
    .eq("vault_id", vaultId)
    .eq("template_id", templateId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastErr) throw new Error(lastErr.message);

  const nextOrder = (last?.sort_order ?? 0) + 1;

  const { error } = await supabase.from("template_items").insert({
    vault_id: vaultId,
    template_id: templateId,
    exercise_id: exerciseId,
    sort_order: nextOrder,
    target_sets: defaultTargetSets,
  });

  if (error) throw new Error(error.message);
}

export async function createExerciseAndAddToTemplateDb(
  vaultId: string,
  templateId: string,
  args: { name: string; modality: Enums<"modality">; defaultTargetSets?: number }
) {
  const defaultTargetSets = args.defaultTargetSets ?? 3;
  const supabase = await createClient();

  const { data: ex, error: exErr } = await supabase
    .from("exercises")
    .insert({ vault_id: vaultId, name: args.name, modality: args.modality })
    .select("id")
    .single();

  if (exErr) throw new Error(exErr.message);

  const { data: last, error: lastErr } = await supabase
    .from("template_items")
    .select("sort_order")
    .eq("vault_id", vaultId)
    .eq("template_id", templateId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastErr) throw new Error(lastErr.message);

  const nextOrder = (last?.sort_order ?? 0) + 1;

  const { error } = await supabase.from("template_items").insert({
    vault_id: vaultId,
    template_id: templateId,
    exercise_id: ex.id,
    sort_order: nextOrder,
    target_sets: defaultTargetSets,
  });

  if (error) throw new Error(error.message);

  return { exerciseId: ex.id };
}

export async function setTemplateItemTargetSetsDb(
  vaultId: string,
  templateItemId: string,
  target_sets: number | null
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("template_items")
    .update({ target_sets })
    .eq("id", templateItemId)
    .eq("vault_id", vaultId);

  if (error) throw new Error(error.message);
}

export async function removeTemplateItemDb(vaultId: string, templateItemId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("template_items")
    .delete()
    .eq("id", templateItemId)
    .eq("vault_id", vaultId);

  if (error) throw new Error(error.message);
}

/**
 * Swaps sort_order with neighbor (up/down) and persists both updates.
 * Note: two updates; if you care about atomicity later, move to an RPC.
 */
export async function moveTemplateItemDb(
  vaultId: string,
  templateId: string,
  templateItemId: string,
  direction: "up" | "down"
) {
  const supabase = await createClient();

  const { data: items, error } = await supabase
    .from("template_items")
    .select("id,sort_order")
    .eq("vault_id", vaultId)
    .eq("template_id", templateId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  const list = items ?? [];
  const idx = list.findIndex((x) => x.id === templateItemId);
  if (idx === -1) return;

  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= list.length) return;

  const a = list[idx];
  const b = list[swapWith];

  const { error: u1 } = await supabase
    .from("template_items")
    .update({ sort_order: b.sort_order })
    .eq("id", a.id)
    .eq("vault_id", vaultId);
  if (u1) throw new Error(u1.message);

  const { error: u2 } = await supabase
    .from("template_items")
    .update({ sort_order: a.sort_order })
    .eq("id", b.id)
    .eq("vault_id", vaultId);
  if (u2) throw new Error(u2.message);
}

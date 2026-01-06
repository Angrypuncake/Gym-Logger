"use server";

import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/supabase";

export async function renameTemplate(vaultId: string, templateId: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("templates")
    .update({ name })
    .eq("id", templateId)
    .eq("vault_id", vaultId);

  if (error) throw new Error(error.message);
}

export async function addExistingExercise(
  vaultId: string,
  templateId: string,
  formData: FormData
) {
  const exerciseId = String(formData.get("exercise_id") || "").trim();
  if (!exerciseId) return;

  const supabase = await createClient();

  // Next order for template_items
  const { data: last, error: lastErr } = await supabase
    .from("template_items")
    .select("order")
    .eq("vault_id", vaultId)
    .eq("template_id", templateId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastErr) throw new Error(lastErr.message);
  const nextOrder = (last?.order ?? 0) + 1;

  const { error } = await supabase.from("template_items").insert({
    vault_id: vaultId,
    template_id: templateId,
    exercise_id: exerciseId,
    order: nextOrder,
    target_sets: 3,
  });

  if (error) throw new Error(error.message);
}

export async function createExerciseAndAdd(
  vaultId: string,
  templateId: string,
  formData: FormData
) {
  const name = String(formData.get("name") || "").trim();
  const modality = String(formData.get("modality") || "REPS") as Enums<"modality">;

  if (!name) return;

  const supabase = await createClient();

  // Create exercise (or reuse if unique constraint exists; here we try insert then fallback)
  const { data: ex, error: exErr } = await supabase
    .from("exercises")
    .insert({ vault_id: vaultId, name, modality })
    .select("id")
    .single();

  if (exErr) throw new Error(exErr.message);

  // Next order for template_items
  const { data: last, error: lastErr } = await supabase
    .from("template_items")
    .select("order")
    .eq("vault_id", vaultId)
    .eq("template_id", templateId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastErr) throw new Error(lastErr.message);
  const nextOrder = (last?.order ?? 0) + 1;

  const { error } = await supabase.from("template_items").insert({
    vault_id: vaultId,
    template_id: templateId,
    exercise_id: ex.id,
    order: nextOrder,
    target_sets: 3,
  });

  if (error) throw new Error(error.message);
}

export async function setTargetSets(
  vaultId: string,
  templateItemId: string,
  formData: FormData
) {
  const raw = String(formData.get("target_sets") || "").trim();
  const target_sets = raw === "" ? null : Number(raw);

  if (target_sets !== null && (!Number.isFinite(target_sets) || target_sets < 1 || target_sets > 20)) {
    throw new Error("target_sets must be 1–20 (or blank).");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("template_items")
    .update({ target_sets })
    .eq("id", templateItemId)
    .eq("vault_id", vaultId);

  if (error) throw new Error(error.message);
}

export async function removeTemplateItem(vaultId: string, templateItemId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("template_items")
    .delete()
    .eq("id", templateItemId)
    .eq("vault_id", vaultId);

  if (error) throw new Error(error.message);
}

export async function moveItem(
  vaultId: string,
  templateId: string,
  templateItemId: string,
  direction: "up" | "down"
) {
  const supabase = await createClient();

  // Load all items in order
  const { data: items, error } = await supabase
    .from("template_items")
    .select("id,order")
    .eq("vault_id", vaultId)
    .eq("template_id", templateId)
    .order("order", { ascending: true });

  if (error) throw new Error(error.message);

  const idx = (items ?? []).findIndex((x) => x.id === templateItemId);
  if (idx === -1) return;

  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= (items ?? []).length) return;

  const a = items![idx];
  const b = items![swapWith];

  // Swap order values
  const { error: u1 } = await supabase
    .from("template_items")
    .update({ order: b.order })
    .eq("id", a.id)
    .eq("vault_id", vaultId);

  if (u1) throw new Error(u1.message);

  const { error: u2 } = await supabase
    .from("template_items")
    .update({ order: a.order })
    .eq("id", b.id)
    .eq("vault_id", vaultId);

  if (u2) throw new Error(u2.message);
}

import { createClient } from "@/lib/supabase/server";

export async function listTemplates(vaultId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("templates")
    .select("id,name,sort_order")
    .eq("vault_id", vaultId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listTemplateItemPreviews(vaultId: string, templateIds: string[]) {
  if (templateIds.length === 0) return new Map<string, string[]>();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("template_items")
    .select("template_id,sort_order,exercise:exercises(name)")
    .eq("vault_id", vaultId)
    .in("template_id", templateIds)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  const map = new Map<string, string[]>();
  for (const it of data ?? []) {
    const name = (it.exercise as unknown as { name: string } | null)?.name;
    if (!name) continue;
    const arr = map.get(it.template_id) ?? [];
    arr.push(name);
    map.set(it.template_id, arr);
  }
  return map;
}

export async function getTemplateEditorData(vaultId: string, templateId: string) {
const supabase = await createClient();
const { data: template, error: tErr } = await supabase
    .from("templates")
    .select("id,name,sort_order")
    .eq("vault_id", vaultId)
    .eq("id", templateId)
    .single();

    if (tErr) throw new Error(tErr.message);


  const { data: items, error: iErr } = await supabase
    .from("template_items")
    .select("id,sort_order,target_sets,exercise_id, exercise:exercises(id,name,modality)")
    .eq("vault_id", vaultId)
    .eq("template_id", templateId)
    .order("sort_order", { ascending: true });

    if (iErr) throw new Error(iErr.message);


  const { data: exercises, error: eErr } = await supabase
    .from("exercises")
    .select("id,name,modality")
    .eq("vault_id", vaultId)
    .order("name", { ascending: true });
    if (eErr) throw new Error(eErr.message);

  return {template, items: items ?? [], exercises: exercises ?? []};
}

export async function createTemplate(vaultId: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Template name is required");

  const supabase = await createClient();

  // next order = max(order)+1
  const { data: last, error: lastErr } = await supabase
    .from("templates")
    .select("sort_order")
    .eq("vault_id", vaultId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastErr) throw new Error(lastErr.message);

  const nextOrder = (last?.sort_order ?? 0) + 1;

  const { data: tpl, error } = await supabase
    .from("templates")
    .insert({ vault_id: vaultId, name, sort_order: nextOrder })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  return {tpl, last}
  
}



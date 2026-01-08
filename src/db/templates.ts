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

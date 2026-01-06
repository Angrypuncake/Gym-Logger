"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createTemplate(vaultId: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const supabase = await createClient();

  // next order = max(order)+1
  const { data: last, error: lastErr } = await supabase
    .from("templates")
    .select("order")
    .eq("vault_id", vaultId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastErr) throw new Error(lastErr.message);

  const nextOrder = (last?.order ?? 0) + 1;

  const { data: tpl, error } = await supabase
    .from("templates")
    .insert({ vault_id: vaultId, name, order: nextOrder })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  redirect(`/v/${vaultId}/templates/${tpl.id}`);
}

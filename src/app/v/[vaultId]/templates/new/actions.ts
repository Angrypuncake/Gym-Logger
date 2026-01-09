"use server";

import { redirect } from "next/navigation";
import { createTemplate } from "@/db/templates";

export async function createTemplateAction(vaultId: string, formData: FormData){
  const { tpl } = await createTemplate(vaultId, formData)
  redirect(`/v/${vaultId}/templates/${tpl.id}`);
}
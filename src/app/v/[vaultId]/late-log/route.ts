import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ vaultId: string }> }
) {
  const { vaultId } = await params;
  const form = await req.formData();

  const templateId = String(form.get("template_id") || "").trim();
  const day = String(form.get("day") || "").trim(); // YYYY-MM-DD

  if (!templateId) return NextResponse.json({ error: "missing template_id" }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return NextResponse.json({ error: "invalid day" }, { status: 400 });

  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  // Create a finished session (does NOT violate single-active constraint)
  const { data: session, error: sErr } = await supabase
    .from("workout_sessions")
    .insert({
      vault_id: vaultId,
      template_id: templateId,
      planned_template_id: templateId,
      session_date: day,
      date: nowIso,
      finished_at: nowIso,
    } as any)
    .select("id")
    .single();

  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

  const sessionId = session.id as string;

  // Load template items
  const { data: tItems, error: tErr } = await supabase
    .from("template_items")
    .select("exercise_id,order,target_sets")
    .eq("vault_id", vaultId)
    .eq("template_id", templateId)
    .order("order", { ascending: true });

  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

  // Insert entries
  const entriesPayload = (tItems ?? []).map((it) => ({
    vault_id: vaultId,
    session_id: sessionId,
    exercise_id: it.exercise_id,
    order: it.order,
  }));

  const { data: entries, error: eErr } = await supabase
    .from("workout_entries")
    .insert(entriesPayload)
    .select("id,order");

  if (eErr) return NextResponse.json({ error: eErr.message }, { status: 500 });

  // Insert planned sets
  const entryByOrder = new Map<number, string>();
  for (const e of entries ?? []) entryByOrder.set(e.order, e.id);

  const setsPayload: Array<{ vault_id: string; entry_id: string; set_index: number }> = [];

  for (const it of tItems ?? []) {
    const entryId = entryByOrder.get(it.order);
    if (!entryId) continue;

    const n = it.target_sets ?? 3;
    for (let i = 1; i <= n; i++) setsPayload.push({ vault_id: vaultId, entry_id: entryId, set_index: i });
  }

  if (setsPayload.length) {
    const { error: setsErr } = await supabase.from("sets").insert(setsPayload);
    if (setsErr) return NextResponse.json({ error: setsErr.message }, { status: 500 });
  }

  return NextResponse.redirect(new URL(`/v/${vaultId}/sessions/${sessionId}`, req.url));
}

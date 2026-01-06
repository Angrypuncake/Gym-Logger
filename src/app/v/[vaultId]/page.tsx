import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function pct(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export default async function VaultHome({
  params,
}: {
  params: Promise<{ vaultId: string }>;
}) {
  const { vaultId } = await params;
  const supabase = await createClient();

  // 1) Templates
  const { data: templates, error: templatesErr } = await supabase
    .from("templates")
    .select("id,name,order")
    .eq("vault_id", vaultId)
    .order("order", { ascending: true });

  if (templatesErr) return <pre>{templatesErr.message}</pre>;

  const templateIds = (templates ?? []).map((t) => t.id);

  // Fetch all template_items + exercise names once, then group in JS
  const { data: items, error: itemsErr } = await supabase
    .from("template_items")
    .select("template_id,order,exercise:exercises(name)")
    .eq("vault_id", vaultId)
    .in("template_id", templateIds)
    .order("order", { ascending: true });

  if (itemsErr) return <pre>{itemsErr.message}</pre>;

  const itemsByTemplate = new Map<string, { name: string }[]>();
  for (const it of items ?? []) {
    const exName = (it.exercise as unknown as { name: string } | null)?.name;
    if (!exName) continue;
    const arr = itemsByTemplate.get(it.template_id) ?? [];
    arr.push({ name: exName });
    itemsByTemplate.set(it.template_id, arr);
  }

  // 2) Current workout (latest session for now; add finished_at later if needed)
  const { data: currentSession } = await supabase
    .from("workout_sessions")
    .select("id,date,template_id,template:templates(name)")
    .eq("vault_id", vaultId)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  let current = null as null | {
    sessionId: string;
    templateName: string;
    pct: number;
  };

  if (currentSession?.id) {
    const sessionId = currentSession.id;
    const templateName =
      (currentSession.template as unknown as { name: string } | null)?.name ?? "Workout";

    // Progress = completed sets / total sets
    // Completed = has reps or duration_sec (and optionally weight_kg)
    const { data: sets } = await supabase
      .from("sets")
      .select("reps,weight_kg,duration_sec, workout_entries!inner(session_id)")
      .eq("vault_id", vaultId)
      .eq("workout_entries.session_id", sessionId);

    const total = sets?.length ?? 0;
    const done =
      sets?.filter((s) => (s.reps ?? null) !== null || (s.duration_sec ?? null) !== null).length ??
      0;

    current = {
      sessionId,
      templateName,
      pct: total === 0 ? 0 : pct((done / total) * 100),
    };
  }

  return (
    <div style={{ padding: 16, maxWidth: 860, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <h1 style={{ fontSize: 16, margin: 0 }}>Program days</h1>
        <Link href={`/v/${vaultId}/templates/new`}>Add new template</Link>
      </div>

      {current && (
        <section style={{ border: "1px solid #242c35", borderRadius: 14, padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600 }}>Current workout</div>
              <div style={{ opacity: 0.7 }}>
                {current.templateName} · {current.pct}%
              </div>
            </div>
            <Link href={`/v/${vaultId}/sessions/${current.sessionId}`}>Resume</Link>
          </div>
          <div style={{ marginTop: 10, height: 10, border: "1px solid #242c35", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${current.pct}%` }} />
          </div>
        </section>
      )}

      <section style={{ border: "1px solid #242c35", borderRadius: 14, padding: 14 }}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Templates</div>

        {(templates ?? []).map((t) => {
          const ex = itemsByTemplate.get(t.id) ?? [];
          const count = ex.length;
          const preview = ex.slice(0, 4).map((x) => x.name).join(" · ");

          return (
            <div key={t.id} style={{ padding: "10px 0", borderTop: "1px solid #242c35" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{t.name}</div>
                  <div style={{ opacity: 0.7 }}>{preview}</div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ opacity: 0.7, border: "1px solid #242c35", padding: "6px 10px", borderRadius: 999 }}>
                    {count} exercises
                  </span>
                  <Link href={`/v/${vaultId}/templates/${t.id}`}>Edit</Link>
                  <form action={`/v/${vaultId}/start`} method="post">
                    <input type="hidden" name="template_id" value={t.id} />
                    <button type="submit">Start</button>
                  </form>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

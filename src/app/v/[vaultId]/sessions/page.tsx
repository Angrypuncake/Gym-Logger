import Link from "next/link";
import { listTemplates, listTemplateItemPreviews } from "@/db/templates";
import { getCurrentSession, getSessionProgressPct } from "@/db/sessions";

export default async function VaultHome({
  params,
}: {
  params: Promise<{ vaultId: string }>;
}) {
  const { vaultId } = await params;

  const templates = await listTemplates(vaultId);
  const templateIds = templates.map((t) => t.id);
  const itemsByTemplate = await listTemplateItemPreviews(vaultId, templateIds);

  const currentSession = await getCurrentSession(vaultId);

  let current: null | { sessionId: string; templateName: string; pct: number } = null;

  if (currentSession?.id) {
    const templateName =
      (currentSession.template as unknown as { name: string } | null)?.name ?? "Workout";

    const pct = await getSessionProgressPct(vaultId, currentSession.id);
    current = { sessionId: currentSession.id, templateName, pct };
  }

  // render (your existing JSX)
  return (
    <div style={{ padding: 16, maxWidth: 860, margin: "0 auto" }}>
      <Link href={`/v/${vaultId}/sessions`}>See workout history</Link>

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

        {templates.map((t) => {
          const ex = itemsByTemplate.get(t.id) ?? [];
          const count = ex.length;
          const preview = ex.slice(0, 4).join(" · ");

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

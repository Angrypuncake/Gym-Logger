import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function formatDate(d: string) {
  const dt = new Date(d);
  return dt.toLocaleString();
}

export default async function SessionsHistoryPage({
  params,
}: {
  params: Promise<{ vaultId: string }>;
}) {
  const { vaultId } = await params;
  const supabase = await createClient();

  // Completed sessions only
  const { data: sessions, error: sErr } = await supabase
    .from("workout_sessions")
    .select("id,date,finished_at, template:templates(name)")
    .eq("vault_id", vaultId)
    .not("finished_at", "is", null)
    .order("finished_at", { ascending: false })
    .limit(50);

  if (sErr) return <pre>{sErr.message}</pre>;

  const sessionIds = (sessions ?? []).map((s) => s.id);

  // Pull sets for these sessions and compute completion stats
  // Completed set = reps != null OR duration_sec != null
  const { data: sets, error: setsErr } = await supabase
    .from("sets")
    .select("reps,duration_sec, workout_entries!inner(session_id)")
    .eq("vault_id", vaultId)
    .in("workout_entries.session_id", sessionIds);

  if (setsErr) return <pre>{setsErr.message}</pre>;

  const stats = new Map<string, { total: number; done: number }>();
  for (const row of sets ?? []) {
    const sid = (row.workout_entries as unknown as { session_id: string }).session_id;
    const cur = stats.get(sid) ?? { total: 0, done: 0 };
    cur.total += 1;
    if (row.reps !== null || row.duration_sec !== null) cur.done += 1;
    stats.set(sid, cur);
  }

  return (
    <div style={{ padding: 16, maxWidth: 860, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 16 }}>Workout history</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href={`/v/${vaultId}`}>Home</Link>
        </div>
      </div>

      {(sessions?.length ?? 0) === 0 ? (
        <div style={{ opacity: 0.7 }}>No completed workouts yet.</div>
      ) : (
        <div style={{ border: "1px solid #242c35", borderRadius: 14, overflow: "hidden" }}>
          {(sessions ?? []).map((s, idx) => {
            const templateName =
              (s.template as unknown as { name: string } | null)?.name ?? "Workout";
            const st = stats.get(s.id) ?? { total: 0, done: 0 };
            const pct = st.total === 0 ? 0 : Math.round((st.done / st.total) * 100);

            return (
              <div
                key={s.id}
                style={{
                  padding: 14,
                  borderTop: idx === 0 ? "none" : "1px solid #242c35",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{templateName}</div>
                  <div style={{ opacity: 0.7 }}>
                    Finished: {s.finished_at ? formatDate(s.finished_at) : "—"} · Started:{" "}
                    {formatDate(s.date)}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span
                    style={{
                      opacity: 0.8,
                      border: "1px solid #242c35",
                      padding: "6px 10px",
                      borderRadius: 999,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {pct}% · {st.done}/{st.total} sets
                  </span>
                  <Link href={`/v/${vaultId}/sessions/${s.id}`}>View</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

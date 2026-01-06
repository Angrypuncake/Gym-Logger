import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { addExerciseToSession, saveSet, finishWorkout  } from "./actions";

type EntryRow = {
  id: string;
  order: number;
  exercise: { id: string; name: string; modality: "REPS" | "ISOMETRIC" };
};

type SetRow = {
  id: string;
  entry_id: string;
  set_index: number;
  reps: number | null;
  weight_kg: number | null;
  duration_sec: number | null;
};

export default async function SessionPage({
  params,
}: {
  params: Promise<{ vaultId: string; sessionId: string }>;
}) {
  const { vaultId, sessionId } = await params;
  const supabase = await createClient();

  // Session header
  const { data: session, error: sErr } = await supabase
    .from("workout_sessions")
    .select("id,date,notes, template:templates(name)")
    .eq("vault_id", vaultId)
    .eq("id", sessionId)
    .single();

  if (sErr) return <pre>{sErr.message}</pre>;

  const templateName =
    (session.template as unknown as { name: string } | null)?.name ?? "Workout";

  // Entries
  const { data: entries, error: eErr } = await supabase
    .from("workout_entries")
    .select("id,order, exercise:exercises(id,name,modality)")
    .eq("vault_id", vaultId)
    .eq("session_id", sessionId)
    .order("order", { ascending: true });

  if (eErr) return <pre>{eErr.message}</pre>;

  const entryIds = (entries ?? []).map((e) => e.id);

  // Sets
  const { data: sets, error: setsErr } = await supabase
    .from("sets")
    .select("id,entry_id,set_index,reps,weight_kg,duration_sec")
    .eq("vault_id", vaultId)
    .in("entry_id", entryIds)
    .order("set_index", { ascending: true });

  if (setsErr) return <pre>{setsErr.message}</pre>;

  const setsByEntry = new Map<string, SetRow[]>();
  for (const s of (sets ?? []) as SetRow[]) {
    const arr = setsByEntry.get(s.entry_id) ?? [];
    arr.push(s);
    setsByEntry.set(s.entry_id, arr);
  }

  // Exercise picker data
  const { data: allExercises } = await supabase
    .from("exercises")
    .select("id,name,modality")
    .eq("vault_id", vaultId)
    .order("name", { ascending: true });

  return (
    <div style={{ padding: 16, maxWidth: 920, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700 }}>{templateName}</div>
          <div style={{ opacity: 0.7 }}>
            Session {new Date(session.date).toLocaleString()}
          </div>
        </div>
        <Link href={`/v/${vaultId}`}>Back</Link>
      </div>

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {(entries as unknown as EntryRow[]).map((entry) => {
          const ex = entry.exercise;
          const entrySets = setsByEntry.get(entry.id) ?? [];

          return (
            <section
              key={entry.id}
              style={{ border: "1px solid #242c35", borderRadius: 14, padding: 14 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ fontWeight: 600 }}>{ex.name}</div>
                <div style={{ opacity: 0.7 }}>{ex.modality}</div>
              </div>

              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                {entrySets.map((set) => {
                  const isDone = set.reps !== null || set.duration_sec !== null;

                  return (
                    <form
                      key={set.id}
                      action={saveSet.bind(null, vaultId, sessionId)}
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          ex.modality === "REPS" ? "70px 90px 90px 1fr" : "70px 120px 1fr",
                        gap: 8,
                        alignItems: "center",
                        padding: 10,
                        border: "1px solid #242c35",
                        borderRadius: 12,
                      }}
                    >
                      <input type="hidden" name="set_id" value={set.id} />

                      <div style={{ fontWeight: 600, opacity: isDone ? 1 : 0.7 }}>
                        Set {set.set_index}
                      </div>

                      {ex.modality === "REPS" ? (
                        <>
                          <input
                            name="weight_kg"
                            inputMode="decimal"
                            placeholder="kg"
                            defaultValue={set.weight_kg ?? ""}
                          />
                          <input
                            name="reps"
                            inputMode="numeric"
                            placeholder="reps"
                            defaultValue={set.reps ?? ""}
                          />
                        </>
                      ) : (
                        <input
                          name="duration_sec"
                          inputMode="numeric"
                          placeholder="sec"
                          defaultValue={set.duration_sec ?? ""}
                        />
                      )}

                      <button type="submit" style={{ justifySelf: "end" }}>
                        Save
                      </button>
                    </form>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <section style={{ marginTop: 16, border: "1px solid #242c35", borderRadius: 14, padding: 14 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Add exercise</div>
        <form action={addExerciseToSession.bind(null, vaultId, sessionId)} style={{ display: "flex", gap: 8 }}>
          <select name="exercise_id" defaultValue="">
            <option value="" disabled>
              Select…
            </option>
            {(allExercises ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.modality})
              </option>
            ))}
          </select>
          <button type="submit">Add (3 sets)</button>
        </form>
      </section>
      <form action={finishWorkout.bind(null, vaultId, sessionId)}>
        <button type="submit">Finish workout</button>
        </form>
    </div>

    
  );
}

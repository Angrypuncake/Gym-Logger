import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  addExistingExercise,
  createExerciseAndAdd,
  moveItem,
  removeTemplateItem,
  renameTemplate,
  setTargetSets,
} from "./actions";

type ItemRow = {
  id: string;
  order: number;
  target_sets: number | null;
  exercise: { id: string; name: string; modality: "REPS" | "ISOMETRIC" };
};

export default async function TemplateEditorPage({
  params,
}: {
  params: Promise<{ vaultId: string; templateId: string }>;
}) {
  const { vaultId, templateId } = await params;
  const supabase = await createClient();

  const { data: template, error: tErr } = await supabase
    .from("templates")
    .select("id,name,order")
    .eq("vault_id", vaultId)
    .eq("id", templateId)
    .single();

  if (tErr) return <pre>{tErr.message}</pre>;

  const { data: items, error: iErr } = await supabase
    .from("template_items")
    .select("id,order,target_sets, exercise:exercises(id,name,modality)")
    .eq("vault_id", vaultId)
    .eq("template_id", templateId)
    .order("order", { ascending: true });

  if (iErr) return <pre>{iErr.message}</pre>;

  const { data: exercises } = await supabase
    .from("exercises")
    .select("id,name,modality")
    .eq("vault_id", vaultId)
    .order("name", { ascending: true });

  const used = new Set((items ?? []).map((it) => (it.exercise as any)?.id).filter(Boolean));
  const availableExercises = (exercises ?? []).filter((e) => !used.has(e.id));

  return (
    <div style={{ padding: 16, maxWidth: 920, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700 }}>Template editor</div>
          <div style={{ opacity: 0.7 }}>Vault: {vaultId}</div>
        </div>
        <Link href={`/v/${vaultId}`}>Back</Link>
      </div>

      <section style={{ marginTop: 14, border: "1px solid #242c35", borderRadius: 14, padding: 14 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Template details</div>
        <form action={renameTemplate.bind(null, vaultId, templateId)} style={{ display: "flex", gap: 8 }}>
          <input name="name" defaultValue={template.name} />
          <button type="submit">Rename</button>
        </form>
      </section>

      <section style={{ marginTop: 14, border: "1px solid #242c35", borderRadius: 14, padding: 14 }}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Exercises</div>

        <div style={{ display: "grid", gap: 10 }}>
          {(items as unknown as ItemRow[]).map((it, idx) => (
            <div
              key={it.id}
              style={{
                border: "1px solid #242c35",
                borderRadius: 12,
                padding: 12,
                display: "grid",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ fontWeight: 600 }}>
                  {idx + 1}. {it.exercise.name} <span style={{ opacity: 0.7 }}>({it.exercise.modality})</span>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <form action={moveItem.bind(null, vaultId, templateId, it.id, "up")}>
                    <button type="submit" disabled={idx === 0}>Up</button>
                  </form>
                  <form action={moveItem.bind(null, vaultId, templateId, it.id, "down")}>
                    <button type="submit" disabled={idx === (items?.length ?? 1) - 1}>Down</button>
                  </form>
                  <form action={removeTemplateItem.bind(null, vaultId, it.id)}>
                    <button type="submit">Remove</button>
                  </form>
                </div>
              </div>

              <form action={setTargetSets.bind(null, vaultId, it.id)} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <label style={{ opacity: 0.8 }}>Sets</label>
                <input
                  name="target_sets"
                  inputMode="numeric"
                  defaultValue={it.target_sets ?? ""}
                  placeholder="3"
                  style={{ width: 80 }}
                />
                <button type="submit">Save</button>
                <span style={{ opacity: 0.7 }}>
                  (blank = default later)
                </span>
              </form>
            </div>
          ))}

          {(items?.length ?? 0) === 0 && (
            <div style={{ opacity: 0.7 }}>No exercises yet. Add one below.</div>
          )}
        </div>
      </section>

      <section style={{ marginTop: 14, border: "1px solid #242c35", borderRadius: 14, padding: 14 }}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Add existing exercise</div>
        <form action={addExistingExercise.bind(null, vaultId, templateId)} style={{ display: "flex", gap: 8 }}>
          <select name="exercise_id" defaultValue="">
            <option value="" disabled>Select…</option>
            {availableExercises.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.modality})
              </option>
            ))}
          </select>
          <button type="submit" disabled={availableExercises.length === 0}>
            Add
          </button>
        </form>
        {availableExercises.length === 0 && (
          <div style={{ marginTop: 8, opacity: 0.7 }}>
            No unused exercises available. Create a new one below.
          </div>
        )}
      </section>

      <section style={{ marginTop: 14, border: "1px solid #242c35", borderRadius: 14, padding: 14 }}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Create new exercise</div>
        <form action={createExerciseAndAdd.bind(null, vaultId, templateId)} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input name="name" placeholder="Exercise name" />
          <select name="modality" defaultValue="REPS">
            <option value="REPS">REPS</option>
            <option value="ISOMETRIC">ISOMETRIC</option>
          </select>
          <button type="submit">Create + Add</button>
        </form>
      </section>

      <section style={{ marginTop: 14 }}>
        <Link href={`/v/${vaultId}`}>Done</Link>
      </section>
    </div>
  );
}

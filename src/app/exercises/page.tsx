import { createClient } from "@/lib/supabase/server";
import { createExercise, deleteExercise } from "./actions";
import type { Tables } from "@/types/supabase";

export default async function ExercisesPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("name", { ascending: true });

  if (error) return <pre>{error.message}</pre>;

  const exercises = (data ?? []) as Tables<"exercises">[];

  return (
    <div style={{ padding: 16, maxWidth: 640 }}>
      <h1>Exercises</h1>

      <form
        action={async (fd) => {
          "use server";
          const vault_id = String(fd.get("vault_id") || "");
          const name = String(fd.get("name") || "");
          const modality = String(fd.get("modality") || "REPS") as "REPS" | "ISOMETRIC";

          await createExercise({ vault_id, name, modality });
        }}
        style={{ display: "flex", gap: 8, marginBottom: 16 }}
      >
        <input name="vault_id" placeholder="vault_id" />
        <input name="name" placeholder="name" />
        <select name="modality" defaultValue="REPS">
          <option value="REPS">REPS</option>
          <option value="ISOMETRIC">ISOMETRIC</option>
        </select>
        <button type="submit">Add</button>
      </form>

      <ul>
        {exercises.map((e) => (
          <li key={e.id} style={{ display: "flex", justifyContent: "space-between" }}>
            <span>
              {e.name} ({e.modality})
            </span>
            <form
              action={async () => {
                "use server";
                await deleteExercise(e.id);
              }}
            >
              <button type="submit">Delete</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}

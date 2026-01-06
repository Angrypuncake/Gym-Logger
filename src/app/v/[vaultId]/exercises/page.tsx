import { listExercises } from "@/db/exercises";
import { addExercise, removeExercise } from "./actions";

export default async function ExercisesPage({
  params,
}: {
  params: Promise<{ vaultId: string }>;
}) {
  const { vaultId } = await params;
  const exercises = await listExercises(vaultId);

  return (
    <div style={{ padding: 16, maxWidth: 640 }}>
      <h1>Exercises</h1>

      <form action={addExercise.bind(null, vaultId)} style={{ display: "flex", gap: 8 }}>
        <input name="name" placeholder="Name" />
        <select name="modality" defaultValue="REPS">
          <option value="REPS">REPS</option>
          <option value="ISOMETRIC">ISOMETRIC</option>
        </select>
        <button type="submit">Add</button>
      </form>

      <ul style={{ marginTop: 16 }}>
        {exercises.map((e) => (
          <li key={e.id} style={{ display: "flex", justifyContent: "space-between" }}>
            <span>
              {e.name} ({e.modality})
            </span>
            <form action={removeExercise.bind(null, vaultId, e.id)}>
              <button type="submit">Delete</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}

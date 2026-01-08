// src/app/v/[vaultId]/sessions/[sessionId]/_components/types.ts
export type Modality = "REPS" | "ISOMETRIC";

export type SetRow = {
  id: string;
  entry_id: string;
  set_index: number;
  reps: number | null;
  weight_kg: number | null;
  duration_sec: number | null;
};

export type EntryRow = {
  id: string;
  order: number;
  exercise: { id: string; name: string; modality: Modality; uses_bodyweight: boolean };
  sets: SetRow[];
};

export type ExercisePick = { id: string; name: string; modality: Modality };

export type FnForm = (formData: FormData) => void | Promise<void>;

export type FnId = (id: string) => Promise<void>;
export type FnEntryId = (entryId: string) => Promise<void>;

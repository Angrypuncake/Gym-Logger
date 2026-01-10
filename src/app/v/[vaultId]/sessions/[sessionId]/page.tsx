import {
  moveEntryUp,
  moveEntryDown,
  updateBodyweightAction,
  addExerciseToSessionAction,
  saveSetAction,
  addSetToEntryAction,
  deleteUnloggedSetFromFormAction,
  removeExerciseFromSessionAction,
} from "./actions";

import SessionLogger from "./SessionLogger";
import { SessionHeader } from "./_components/SessionHeader";
import { toDateYmd, toTimeLocal } from "@/lib/utils";
import { getSessionPageData } from "@/db/sessions";
import { createClient } from "@/lib/supabase/server";

type TendonTarget = { targetId: string; targetName: string; confidence: string };

export default async function SessionPage({
  params,
}: {
  params: Promise<{ vaultId: string; sessionId: string }>;
}) {
  const { vaultId, sessionId } = await params;

  let data;
  try {
    data = await getSessionPageData({ vaultId, sessionId });
  } catch (e: any) {
    return <pre>{e?.message ?? "Failed to load session"}</pre>;
  }

  const {
    session,
    entriesWithSets,
    planned,
    completed,
    pct,
    allExercises,
    muscleTargetsByExerciseId,
  } = data;

  // --- Tendon targets by exercise (for session tendon panel)
  let tendonTargetsByExerciseId: Record<string, TendonTarget[]> = {};
  try {
    const entries = (entriesWithSets ?? []) as any[];
    const exerciseIds = Array.from(
      new Set(entries.map((e) => e?.exercise?.id).filter(Boolean))
    ) as string[];

    if (exerciseIds.length > 0) {
      const supabase = await createClient();

      const { data: eteRows, error: eteErr } = await supabase
        .from("exercise_tendon_exposure")
        .select("exercise_id,tendon_target_id,confidence")
        .eq("vault_id", vaultId)
        .in("exercise_id", exerciseIds);

      if (eteErr) throw eteErr;

      const targetIds = Array.from(
        new Set((eteRows ?? []).map((r: any) => r.tendon_target_id).filter(Boolean))
      ) as string[];

      const { data: targets, error: tErr } = await supabase
        .from("anatomical_targets")
        .select("id,name")
        .eq("vault_id", vaultId)
        .in("id", targetIds.length ? targetIds : ["00000000-0000-0000-0000-000000000000"]);

      if (tErr) throw tErr;

      const nameById = new Map<string, string>();
      for (const t of targets ?? []) nameById.set((t as any).id, (t as any).name);

      for (const r of eteRows ?? []) {
        const exId = (r as any).exercise_id as string;
        const tid = (r as any).tendon_target_id as string;
        const confidence = (r as any).confidence as string;
        const targetName = nameById.get(tid) ?? "Unknown";

        (tendonTargetsByExerciseId[exId] ??= []).push({
          targetId: tid,
          targetName,
          confidence,
        });
      }
    }
  } catch {
    tendonTargetsByExerciseId = {};
  }

  const templateName =
    (session.template as unknown as { name: string } | null)?.name ?? "Workout";

  const sessionDay = session.created_at
    ? toDateYmd(session.created_at)
    : (session.session_date as string);

  const startSet = session.started_at !== null;
  const endSet = session.finished_at !== null;

  const startTime = session.started_at ? toTimeLocal(session.started_at) : "";
  const endTime = session.finished_at ? toTimeLocal(session.finished_at) : "";

  return (
    <div className="mx-auto max-w-[980px] px-4 py-6 space-y-4">
      <SessionHeader
        vaultId={vaultId}
        sessionId={sessionId}
        templateName={templateName}
        sessionDay={sessionDay}
        createdAt={session.created_at}
        planned={planned}
        completed={completed}
        pct={pct}
        startSet={startSet}
        endSet={endSet}
        startTime={startTime}
        endTime={endTime}
        bodyWeightKg={session.body_weight_kg as number | null}
        updateBodyweightAction={updateBodyweightAction.bind(null, vaultId, sessionId)}
      />

      <SessionLogger
        entries={entriesWithSets as any}
        allExercises={(allExercises ?? []) as any}
        bodyWeightKg={session.body_weight_kg as number | null}
        updateBodyweightAction={updateBodyweightAction.bind(null, vaultId, sessionId)}
        saveSetAction={saveSetAction.bind(null, vaultId, sessionId)}
        addExerciseAction={addExerciseToSessionAction.bind(null, vaultId, sessionId)}
        addSetAction={addSetToEntryAction.bind(null, vaultId, sessionId)}
        deleteUnloggedSetAction={deleteUnloggedSetFromFormAction.bind(null, vaultId, sessionId)}
        removeEntryAction={removeExerciseFromSessionAction.bind(null, vaultId, sessionId)}
        moveEntryUpAction={moveEntryUp.bind(null, vaultId, sessionId)}
        moveEntryDownAction={moveEntryDown.bind(null, vaultId, sessionId)}
        muscleTargetsByExerciseId={muscleTargetsByExerciseId}
        tendonTargetsByExerciseId={tendonTargetsByExerciseId}
      />
    </div>
  );
}

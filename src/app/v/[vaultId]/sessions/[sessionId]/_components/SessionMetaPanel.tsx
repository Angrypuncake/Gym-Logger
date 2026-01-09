// src/app/v/[vaultId]/sessions/[sessionId]/_components/SessionMetaPanel.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FnForm } from "./types";

export function SessionMetaPanel({
  bodyWeightKg,
  updateBodyweightAction,
  showTotalLoad,
  setShowTotalLoad,
}: {
  bodyWeightKg: number | null;
  updateBodyweightAction?: FnForm; // expects: body_weight_kg
  showTotalLoad: boolean;
  setShowTotalLoad: (v: boolean) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Session</CardTitle>
        <div className="text-sm text-muted-foreground">
          Bodyweight is used only for exercises marked as BW in the Exercise editor.
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <form action={updateBodyweightAction} className="flex items-center gap-2">
          <input
            name="body_weight_kg"
            inputMode="decimal"
            placeholder="Bodyweight (kg)"
            defaultValue={bodyWeightKg ?? ""}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={!updateBodyweightAction}
          />
          <Button type="submit" variant="secondary" size="sm" disabled={!updateBodyweightAction}>
            Save
          </Button>
        </form>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={showTotalLoad}
            onChange={(e) => setShowTotalLoad(e.target.checked)}
          />
          <span>Show total load (BW + external) for BW exercises</span>
        </label>

        <div className="text-xs text-muted-foreground">
          Default: OFF. Set blocks still show external load; totals are informational.
        </div>
      </CardContent>
    </Card>
  );
}

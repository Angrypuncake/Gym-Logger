// src/app/v/[vaultId]/sessions/[sessionId]/_components/SessionHeader.tsx
"use client";

import { Button } from "@/components/ui/button";
import ConfirmSubmitButton from "../ConfirmSubmitButton";
import {
  clearFinishTime,
  clearStartTime,
  discardWorkout,
  setFinishTimeFromForm,
  setStartTimeFromForm,
} from "../actions";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import VaultNav from "../../../_components/VaultNav";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import type { FnForm } from "./types";

const APP_TZ = "Australia/Sydney";

function formatCreatedAt(valueIso: string, timeZone = APP_TZ) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(valueIso));
}

export function SessionHeader(props: {
  vaultId: string;
  sessionId: string;
  templateName: string;
  sessionDay: string; // YYYY-MM-DD
  createdAt: string | null;

  planned: number;
  completed: number;
  pct: number;

  startSet: boolean;
  endSet: boolean;
  startTime: string; // HH:mm
  endTime: string; // HH:mm

  // moved settings here
  bodyWeightKg: number | null;
  updateBodyweightAction?: FnForm; // expects: body_weight_kg
}) {
  const {
    vaultId,
    sessionId,
    templateName,
    sessionDay,
    createdAt,
    planned,
    completed,
    pct,
    startSet,
    endSet,
    startTime,
    endTime,

    bodyWeightKg,
    updateBodyweightAction,
  } = props;

  return (
    <Card>
      <VaultNav vaultId={vaultId} active="home" />
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-wrap items-start gap-3">
          <Button asChild variant="secondary" size="sm">
            <Link href={`/v/${vaultId}/sessions`}>← Calendar</Link>
          </Button>

          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">
              Workout: <span className="font-semibold">{templateName}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Session {sessionDay}
              {createdAt ? ` · Created ${formatCreatedAt(createdAt)}` : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <Badge variant="outline">
              {completed}/{planned}
            </Badge>
            <Badge variant="secondary">{pct}%</Badge>
            <Badge variant="outline">{startSet ? "Start set" : "No start"}</Badge>
            <Badge variant="outline">{endSet ? "End set" : "No end"}</Badge>
          </div>
        </div>

        <Progress value={pct} />

        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          {/* Start */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Start time (fixed day: {sessionDay})
            </div>
            <div className="flex items-center gap-2">
              <form
                action={setStartTimeFromForm.bind(null, vaultId, sessionId, sessionDay)}
                className="flex items-center gap-2 flex-1"
              >
                <input
                  name="started_time"
                  type="time"
                  defaultValue={startTime}
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button type="submit" size="sm" variant="secondary">
                  Save
                </Button>
              </form>

              {startSet ? (
                <form action={clearStartTime.bind(null, vaultId, sessionId)}>
                  <Button type="submit" size="sm" variant="secondary">
                    Clear
                  </Button>
                </form>
              ) : null}
            </div>
          </div>

          {/* End */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              End time (fixed day: {sessionDay})
            </div>
            <div className="flex items-center gap-2">
              <form
                action={setFinishTimeFromForm.bind(null, vaultId, sessionId, sessionDay)}
                className="flex items-center gap-2 flex-1"
              >
                <input
                  name="finished_time"
                  type="time"
                  defaultValue={endTime}
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button type="submit" size="sm" variant="secondary">
                  Save
                </Button>
              </form>

              {endSet ? (
                <form action={clearFinishTime.bind(null, vaultId, sessionId)}>
                  <Button type="submit" size="sm" variant="secondary">
                    Clear
                  </Button>
                </form>
              ) : null}
            </div>
          </div>

          {/* Danger */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Danger</div>
            <form action={discardWorkout.bind(null, vaultId, sessionId)} className="flex">
              <ConfirmSubmitButton
                variant="destructive"
                size="sm"
                confirmText="Discard this session? This deletes the session and all entries/sets."
              >
                Discard
              </ConfirmSubmitButton>
            </form>
          </div>
        </div>

        {/* Session settings now live in header */}
        <Separator />

        <details className="rounded-md border border-border bg-muted/5 px-3 py-2">
          <summary className="cursor-pointer select-none text-sm font-medium">
            Session settings
          </summary>

          <div className="mt-3 space-y-3">
            <form action={updateBodyweightAction} className="flex items-center gap-2">
              <div className="w-24 shrink-0 text-xs text-muted-foreground">Bodyweight</div>
              <input
                name="body_weight_kg"
                inputMode="decimal"
                placeholder="kg"
                defaultValue={bodyWeightKg ?? ""}
                className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={!updateBodyweightAction}
              />
              <Button type="submit" variant="secondary" size="sm" disabled={!updateBodyweightAction}>
                Save
              </Button>
            </form>

          </div>
        </details>
      </CardContent>
    </Card>
  );
}

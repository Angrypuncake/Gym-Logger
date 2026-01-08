"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import type { SummaryRow, TemplateRow } from "./types";
import { pctDone } from "./utils";

import { createSessionAction } from "../../actions";
import { discardWorkout } from "../../[sessionId]/actions";
import ConfirmSubmitButton from "../../[sessionId]/ConfirmSubmitButton";

export function DayPanel({
  vaultId,
  day,
  templates,
  sessions,
  onClose,
  isFuture,
}: {
  vaultId: string;
  day: string; // YYYY-MM-DD
  templates: TemplateRow[];
  sessions: SummaryRow[];
  onClose: () => void;
  isFuture: boolean;
}) {
  const [templateId, setTemplateId] = React.useState<string>("");

  React.useEffect(() => {
    setTemplateId("");
  }, [day]);

  const ordered = React.useMemo(() => {
    return [...sessions].sort((a, b) => a.template_name.localeCompare(b.template_name));
  }, [sessions]);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{day}</div>
        <Button size="sm" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="rounded-xl border p-3 space-y-2">
        <div className="text-sm font-semibold">Create session</div>

        {isFuture ? (
          <div className="text-sm text-muted-foreground">
            Future dates are disabled.
          </div>
        ) : (
          <>
            <form
              action={createSessionAction.bind(null, vaultId)}
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              <input type="hidden" name="session_date" value={day} />

              <select
                name="template_id"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                <option value="" disabled>
                  Select template…
                </option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <Button type="submit" size="sm" disabled={!templateId}>
                Create
              </Button>
            </form>

            <div className="text-xs text-muted-foreground">
              Creates a session for this day and opens the normal SessionLogger. Times are optional and editable later.
            </div>
          </>
        )}
      </div>

      {ordered.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No sessions match the current filters for this day.
        </div>
      ) : (
        <div className="space-y-2">
          {ordered.map((s) => {
            const pct = pctDone(s);

            return (
              <div
                key={s.session_id}
                className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{s.template_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.logged_sets}/{s.planned_sets} · {pct}%{s.has_pr && " · PR"}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/v/${vaultId}/sessions/${s.session_id}`}>
                    <Button size="sm">Open</Button>
                  </Link>

                  <form action={discardWorkout.bind(null, vaultId, s.session_id)}>
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
            );
          })}
        </div>
      )}
    </Card>
  );
}

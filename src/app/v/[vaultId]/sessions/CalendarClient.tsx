"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type SummaryRow = {
  session_id: string;
  template_id: string;
  template_name: string;
  session_date: string; // YYYY-MM-DD
  finished_at: string | null;
  planned_sets: number;
  logged_sets: number;
  modalities: string[];
  has_pr: boolean;
};

type TemplateRow = { id: string; name: string; order: number };

function isoDateUTC(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysGrid(year: number, month0: number) {
  const first = new Date(Date.UTC(year, month0, 1));
  const firstDay = (first.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  const gridStart = new Date(first);
  gridStart.setUTCDate(first.getUTCDate() - firstDay);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setUTCDate(gridStart.getUTCDate() + i);
    days.push(d);
  }
  return days;
}

export default function CalendarClient({
  vaultId,
  year,
  month0,
  summaries,
  templates,
}: {
  vaultId: string;
  year: number;
  month0: number;
  summaries: SummaryRow[];
  templates: TemplateRow[];
}) {
  const [status, setStatus] = React.useState<"ALL" | "IN_PROGRESS" | "COMPLETED">("ALL");
  const [templateId, setTemplateId] = React.useState<string>("ALL");
  const [modality, setModality] = React.useState<"ALL" | "REPS" | "ISOMETRIC">("ALL");
  const [onlyPr, setOnlyPr] = React.useState(false);

  const byDay = React.useMemo(() => {
    const map = new Map<string, SummaryRow[]>();
    for (const s of summaries) {
      const arr = map.get(s.session_date) ?? [];
      arr.push(s);
      map.set(s.session_date, arr);
    }
    return map;
  }, [summaries]);

  const filteredByDay = React.useMemo(() => {
    const map = new Map<string, SummaryRow[]>();
    for (const [day, arr] of byDay.entries()) {
      let xs = arr;

      if (status !== "ALL") {
        xs = xs.filter((s) => (status === "COMPLETED" ? s.finished_at !== null : s.finished_at === null));
      }
      if (templateId !== "ALL") xs = xs.filter((s) => s.template_id === templateId);
      if (modality !== "ALL") xs = xs.filter((s) => s.modalities?.includes(modality));
      if (onlyPr) xs = xs.filter((s) => s.has_pr);

      if (xs.length) map.set(day, xs);
    }
    return map;
  }, [byDay, status, templateId, modality, onlyPr]);

  const days = React.useMemo(() => daysGrid(year, month0), [year, month0]);
  const monthLabel = new Date(Date.UTC(year, month0, 1)).toLocaleString(undefined, { month: "long", year: "numeric" });

  const prev = () => {
    const d = new Date(Date.UTC(year, month0, 1));
    d.setUTCMonth(d.getUTCMonth() - 1);
    window.location.href = `/v/${vaultId}/sessions?y=${d.getUTCFullYear()}&m=${d.getUTCMonth()}`;
  };

  const next = () => {
    const d = new Date(Date.UTC(year, month0, 1));
    d.setUTCMonth(d.getUTCMonth() + 1);
    window.location.href = `/v/${vaultId}/sessions?y=${d.getUTCFullYear()}&m=${d.getUTCMonth()}`;
  };

  const [openDay, setOpenDay] = React.useState<string | null>(null);
  const openDaySessions = openDay ? (filteredByDay.get(openDay) ?? []) : [];

  const [lateTemplateId, setLateTemplateId] = React.useState<string>("");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={prev}>←</Button>
          <div className="text-sm font-semibold">{monthLabel}</div>
          <Button size="sm" variant="secondary" onClick={next}>→</Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="ALL">All</option>
            <option value="IN_PROGRESS">In-progress</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            <option value="ALL">All templates</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>

          <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={modality} onChange={(e) => setModality(e.target.value as any)}>
            <option value="ALL">All modalities</option>
            <option value="REPS">REPS</option>
            <option value="ISOMETRIC">ISOMETRIC</option>
          </select>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyPr} onChange={(e) => setOnlyPr(e.target.checked)} />
            <span>PR only</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="px-1">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const dayKey = isoDateUTC(d);
          const inMonth = d.getUTCMonth() === month0;
          const sessions = filteredByDay.get(dayKey) ?? [];

          return (
            <button
              key={dayKey}
              type="button"
              onClick={() => setOpenDay(dayKey)}
              className={[
                "rounded-xl border p-2 text-left min-h-[92px] transition-colors",
                inMonth ? "bg-background" : "bg-muted/30 text-muted-foreground",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground">{d.getUTCDate()}</div>
                {sessions.some((s) => s.has_pr) && <Badge variant="secondary">PR</Badge>}
              </div>

              <div className="mt-2 space-y-1">
                {sessions.slice(0, 3).map((s) => {
                  const pct = s.planned_sets ? Math.round((s.logged_sets / s.planned_sets) * 100) : 0;
                  const chip = `${s.template_name} · ${pct}%`;
                  return (
                    <div
                      key={s.session_id}
                      className={[
                        "truncate rounded-md px-2 py-1 text-xs",
                        s.finished_at ? "bg-muted" : "bg-emerald-500/10 border border-emerald-500/20",
                      ].join(" ")}
                      title={chip}
                    >
                      {chip}
                    </div>
                  );
                })}
                {sessions.length > 3 && <div className="text-xs text-muted-foreground">+{sessions.length - 3} more</div>}
              </div>
            </button>
          );
        })}
      </div>

      {openDay && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">{openDay}</div>
            <Button size="sm" variant="secondary" onClick={() => setOpenDay(null)}>Close</Button>
          </div>

          <div className="rounded-xl border p-3 space-y-2">
            <div className="text-sm font-semibold">Late log (creates a finished session)</div>

            <form action={`/v/${vaultId}/late-log`} method="post" className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input type="hidden" name="day" value={openDay} />
              <select
                name="template_id"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={lateTemplateId}
                onChange={(e) => setLateTemplateId(e.target.value)}
              >
                <option value="" disabled>Select template…</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <Button type="submit" size="sm" disabled={!lateTemplateId}>Create</Button>
            </form>

            <div className="text-xs text-muted-foreground">
              Opens the normal SessionLogger so you log sets exactly the same way.
            </div>
          </div>

          {openDaySessions.length === 0 ? (
            <div className="text-sm text-muted-foreground">No sessions match the current filters for this day.</div>
          ) : (
            <div className="space-y-2">
              {openDaySessions.map((s) => {
                const pct = s.planned_sets ? Math.round((s.logged_sets / s.planned_sets) * 100) : 0;
                return (
                  <div key={s.session_id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{s.template_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.finished_at ? "Completed" : "In-progress"} · {s.logged_sets}/{s.planned_sets} · {pct}%
                      </div>
                    </div>
                    <Link href={`/v/${vaultId}/sessions/${s.session_id}`}>
                      <Button size="sm">{s.finished_at ? "View/Edit" : "Continue"}</Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// src/app/v/[vaultId]/sessions/CalendarClient.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

// IMPORTANT: server action (new flow: create session for a day + template)
import { createSessionAction } from "./actions";

import { discardWorkout } from "./[sessionId]/actions";
import ConfirmSubmitButton from "./[sessionId]/ConfirmSubmitButton";

type SummaryRow = {
  session_id: string;
  template_id: string;
  template_name: string;
  session_date: string; // YYYY-MM-DD
  finished_at: string | null; // timekeeping only (no status semantics)
  planned_sets: number;
  logged_sets: number;
  modalities: string[];
  has_pr: boolean;
};

type TemplateRow = { id: string; name: string; sort_order: number };

function clampPct(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function pctDone(s: SummaryRow) {
  return s.planned_sets ? clampPct((s.logged_sets / s.planned_sets) * 100) : 0;
}

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

type Filters = {
  templateId: string; // "ALL" or template uuid
  modality: "ALL" | "REPS" | "ISOMETRIC";
  onlyPr: boolean;
};

function groupByDay(rows: SummaryRow[]) {
  const map = new Map<string, SummaryRow[]>();
  for (const s of rows) {
    const arr = map.get(s.session_date) ?? [];
    arr.push(s);
    map.set(s.session_date, arr);
  }
  return map;
}

function applyFilters(byDay: Map<string, SummaryRow[]>, f: Filters) {
  const map = new Map<string, SummaryRow[]>();

  for (const [day, arr] of byDay.entries()) {
    let xs = arr;

    if (f.templateId !== "ALL") xs = xs.filter((s) => s.template_id === f.templateId);
    if (f.modality !== "ALL") xs = xs.filter((s) => s.modalities?.includes(f.modality));
    if (f.onlyPr) xs = xs.filter((s) => s.has_pr);

    if (xs.length) map.set(day, xs);
  }

  return map;
}

function MonthNav({
  vaultId,
  year,
  month0,
}: {
  vaultId: string;
  year: number;
  month0: number;
}) {
  const router = useRouter();
  const monthLabel = new Date(Date.UTC(year, month0, 1)).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  function go(delta: number) {
    const d = new Date(Date.UTC(year, month0, 1));
    d.setUTCMonth(d.getUTCMonth() + delta);
    router.push(`/v/${vaultId}/sessions?y=${d.getUTCFullYear()}&m=${d.getUTCMonth()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="secondary" onClick={() => go(-1)}>
        ←
      </Button>
      <div className="text-sm font-semibold">{monthLabel}</div>
      <Button size="sm" variant="secondary" onClick={() => go(1)}>
        →
      </Button>
    </div>
  );
}

function CalendarFilters({
  templates,
  filters,
  setFilters,
}: {
  templates: TemplateRow[];
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      <select
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        value={filters.templateId}
        onChange={(e) => setFilters((x) => ({ ...x, templateId: e.target.value }))}
      >
        <option value="ALL">All templates</option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>



      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={filters.onlyPr}
          onChange={(e) => setFilters((x) => ({ ...x, onlyPr: e.target.checked }))}
        />
        <span>PR only</span>
      </label>
    </div>
  );
}

function DayCell({
  day,
  inMonth,
  sessions,
  selected,
  onOpen,
}: {
  day: Date;
  inMonth: boolean;
  sessions: SummaryRow[];
  selected: boolean;
  onOpen: () => void;
}) {

  const dayNum = day.getUTCDate();
  const hasAnyPr = sessions.some((s) => s.has_pr);

  // stable ordering for display
  const shown = [...sessions].sort((a, b) => a.template_name.localeCompare(b.template_name)).slice(0, 3);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={[
        "rounded-xl border p-2 text-left min-h-[92px]",
        "transition-colors transition-shadow duration-150",
        inMonth ? "bg-background" : "bg-muted/30 text-muted-foreground",
      
        // hover feedback
        "hover:border-primary/40 hover:bg-primary/5",
      
        // active / selected feedback
        selected
          ? "ring-2 ring-primary border-primary bg-primary/10 shadow-sm"
          : "ring-0",
      ].join(" ")}
      
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-foreground">{dayNum}</div>
        {hasAnyPr && <Badge variant="secondary">PR</Badge>}
      </div>

      <div className="mt-2 space-y-1">
        {shown.map((s) => {
          const pct = pctDone(s);
          const chip = `${s.template_name} · ${pct}%`;

          // No "completed/in-progress" semantics; just show percent.
          // Styling is purely based on percent.
          const isFull = pct >= 100;

          return (
            <div
              key={s.session_id}
              className={[
                "truncate rounded-md px-2 py-1 text-xs",
                isFull ? "bg-muted" : "bg-emerald-500/10 border border-emerald-500/20",
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
}

function DayPanel({
  vaultId,
  day,
  templates,
  sessions,
  onClose,
}: {
  vaultId: string;
  day: string; // YYYY-MM-DD
  templates: TemplateRow[];
  sessions: SummaryRow[];
  onClose: () => void;
}) {
  const [templateId, setTemplateId] = React.useState<string>("");

  React.useEffect(() => {
    // reset template picker when day changes
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

        <form action={createSessionAction.bind(null, vaultId)} className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
      </div>

      {ordered.length === 0 ? (
        <div className="text-sm text-muted-foreground">No sessions match the current filters for this day.</div>
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
        <div className="text-sm font-medium truncate">
          {s.template_name}
        </div>

        <div className="text-xs text-muted-foreground">
          {s.logged_sets}/{s.planned_sets} · {pct}%
          {s.has_pr && " · PR"}
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
  const [filters, setFilters] = React.useState<Filters>({
    templateId: "ALL",
    modality: "ALL",
    onlyPr: false,
  });

  const byDay = React.useMemo(() => groupByDay(summaries), [summaries]);
  const filteredByDay = React.useMemo(() => applyFilters(byDay, filters), [byDay, filters]);

  const days = React.useMemo(() => daysGrid(year, month0), [year, month0]);

  const [openDay, setOpenDay] = React.useState<string | null>(null);
  const openDaySessions = openDay ? filteredByDay.get(openDay) ?? [] : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <MonthNav vaultId={vaultId} year={year} month0={month0} />
        <CalendarFilters templates={templates} filters={filters} setFilters={setFilters} />
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="px-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
      {days.map((d) => {
        const dayKey = isoDateUTC(d);
        const inMonth = d.getUTCMonth() === month0;
        const sessions = filteredByDay.get(dayKey) ?? [];
        const selected = openDay === dayKey;

        return (
          <DayCell
            key={dayKey}
            day={d}
            inMonth={inMonth}
            sessions={sessions}
            selected={selected}
            onOpen={() => setOpenDay(dayKey)}
          />
        );
      })}

      </div>

      {openDay && (
        <DayPanel
          vaultId={vaultId}
          day={openDay}
          templates={templates}
          sessions={openDaySessions}
          onClose={() => setOpenDay(null)}
        />
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import type { SummaryRow } from "./types";
import { pctDone } from "./utils";

export function DayCell({
  day,
  inMonth,
  sessions,
  selected,
  isToday,
  isFuture,
  onOpen,
}: {
  day: Date;
  inMonth: boolean;
  sessions: SummaryRow[];
  selected: boolean;
  isToday: boolean;
  isFuture: boolean;
  onOpen: () => void;
}) {
  const dayNum = day.getDate();
  const hasAnyPr = sessions.some((s) => s.has_pr);

  const shown = [...sessions]
    .sort((a, b) => a.template_name.localeCompare(b.template_name))
    .slice(0, 3);

  const base = [
    "rounded-xl border p-2 text-left min-h-[92px]",
    "transition-colors transition-shadow duration-150",
  ];

  const monthStyle = inMonth ? "bg-background" : "bg-muted/30 text-muted-foreground";

  const futureStyle = isFuture
    ? "opacity-50 cursor-not-allowed hover:bg-inherit hover:border-border"
    : "hover:border-primary/40 hover:bg-primary/5";

  const selectedStyle = selected ? "ring-2 ring-primary border-primary bg-primary/10 shadow-sm" : "ring-0";

  const todayStyle =
    isToday && !selected
      ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30"
      : "";

  return (
    <button
      type="button"
      onClick={isFuture ? undefined : onOpen}
      disabled={isFuture}
      aria-current={isToday ? "date" : undefined}
      className={[...base, monthStyle, futureStyle, selectedStyle, todayStyle].join(" ")}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-foreground">{dayNum}</div>
        <div className="flex items-center gap-2">
          {isToday && <span className="text-[10px] text-muted-foreground">Today</span>}
          {hasAnyPr && <Badge variant="secondary">PR</Badge>}
        </div>
      </div>

      <div className="mt-2 space-y-1">
        {shown.map((s) => {
          const pct = pctDone(s);
          const chip = `${s.template_name} · ${pct}%`;
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

        {sessions.length > 3 && (
          <div className="text-xs text-muted-foreground">+{sessions.length - 3} more</div>
        )}
      </div>
    </button>
  );
}

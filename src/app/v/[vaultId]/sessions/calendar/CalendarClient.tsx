"use client";

import * as React from "react";
import { Filters, SummaryRow, TemplateRow } from "./types";
import { applyFilters, daysGridLocal, groupByDay, isoDateLocal } from "./utils";
import { MonthNav } from "./MonthNav";
import { CalendarFilters } from "./CalendarFilters";
import { DayCell } from "./DayCell";
import { DayPanel } from "./DayPanel";


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

  const days = React.useMemo(() => daysGridLocal(year, month0), [year, month0]);

  const todayKey = React.useMemo(() => isoDateLocal(new Date()), []);
  const [openDay, setOpenDay] = React.useState<string | null>(null);

  const openDaySessions = openDay ? filteredByDay.get(openDay) ?? [] : [];
  const openDayIsFuture = openDay ? openDay > todayKey : false;

const [compact, setCompact] = React.useState(false);
React.useEffect(() => {
    try {
      const v = localStorage.getItem("gymlogger.calendar.compact");
      if (v === "1") setCompact(true);
    } catch {}
  }, []);

 function toggleCompact() {
    setCompact((v) => {
      const next = !v;
      try {
        localStorage.setItem("gymlogger.calendar.compact", next ? "1" : "0");
      } catch {}
      return next;
    });
  }

  return (
    <div className="space-y-4">
     <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-background/90 backdrop-blur border-b">
        <div className="flex items-center justify-between gap-3">
        <MonthNav vaultId={vaultId} year={year} month0={month0} />
        <div className="flex items-center gap-2 justify-end flex-wrap">
          <button
            type="button"
            onClick={toggleCompact}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            aria-pressed={compact}
            title="Toggle compact calendar"
          >
            {compact ? "Compact: On" : "Compact: Off"}
          </button>
         <CalendarFilters templates={templates} filters={filters} setFilters={setFilters} />
        </div>
        </div>
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
          const dayKey = isoDateLocal(d);
          const inMonth = d.getMonth() === month0;
          const sessions = filteredByDay.get(dayKey) ?? [];
          const selected = openDay === dayKey;

          const isToday = dayKey === todayKey;
          const isFuture = dayKey > todayKey;

          return (
            <DayCell
              key={dayKey}
              day={d}
              inMonth={inMonth}
              sessions={sessions}
              selected={selected}
              isToday={isToday}
              isFuture={isFuture}
              compact={compact}
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
          isFuture={openDayIsFuture}
          onClose={() => setOpenDay(null)}
        />
      )}
    </div>
  );
}

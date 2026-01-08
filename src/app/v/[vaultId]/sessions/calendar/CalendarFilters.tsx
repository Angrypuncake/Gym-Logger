"use client";

import * as React from "react";
import type { Filters, TemplateRow } from "./types";

export function CalendarFilters({
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

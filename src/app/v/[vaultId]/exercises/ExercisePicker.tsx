// src/components/exercises/ExercisePicker.tsx
"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type ExercisePick = {
  id: string;
  name: string;
  modality: "REPS" | "ISOMETRIC";
};

type Props = {
  exercises: ExercisePick[];
  name?: string; // form field name, default "exercise_id"
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  listHeightClassName?: string; // e.g. "h-48"
  defaultSelectedId?: string;
};

export function ExercisePicker({
  exercises,
  name = "exercise_id",
  emptyText = "No exercises found.",
  disabled,
  className,
  listHeightClassName = "h-52",
  defaultSelectedId = "",
}: Props) {
  const [q, setQ] = React.useState("");
  const [selectedId, setSelectedId] = React.useState(defaultSelectedId);

  const filtered = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return exercises;
    return exercises.filter((e) => {
      const hay = `${e.name} ${e.modality}`.toLowerCase();
      return hay.includes(query);
    });
  }, [q, exercises]);

  // If selection disappears due to filtering, keep selection but don’t “lose” it.
  const selected = React.useMemo(
    () => exercises.find((e) => e.id === selectedId) ?? null,
    [exercises, selectedId]
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="space-y-1">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search exercises…"
          disabled={disabled || exercises.length === 0}
        />
        <div className="text-xs text-muted-foreground">
          {selected ? (
            <>
              Selected: <span className="text-foreground">{selected.name}</span>{" "}
              <span className="text-muted-foreground">({selected.modality})</span>
            </>
          ) : (
            "Select an exercise from the list."
          )}
        </div>
      </div>

      <input type="hidden" name={name} value={selectedId} />

      <div className="rounded-md border">
        <ScrollArea className={cn("w-full", listHeightClassName)}>
          <div className="p-1">
            {filtered.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">{emptyText}</div>
            ) : (
              <ul className="space-y-1">
                {filtered.map((e) => {
                  const isActive = e.id === selectedId;
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => setSelectedId(e.id)}
                        className={cn(
                          "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          isActive && "bg-accent text-accent-foreground"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate">{e.name}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {e.modality}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

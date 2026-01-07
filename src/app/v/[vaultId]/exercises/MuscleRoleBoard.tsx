"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";

type Role = "PRIMARY" | "SECONDARY" | "STABILIZER";
type Column = Role | "UNASSIGNED";

type Target = { id: string; name: string };

export function MuscleRoleBoard({
  targets,
  initialSelected,
}: {
  targets: Target[];
  initialSelected: Record<string, Role>; // targetId -> role
}) {
  const [selected, setSelected] = React.useState<Record<string, Role>>(initialSelected);
  const [over, setOver] = React.useState<Column | null>(null);

  // Reset when switching exercises / refetching
  React.useEffect(() => {
    setSelected(initialSelected);
  }, [initialSelected]);

  function onDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }

  function allowDrop(e: React.DragEvent, col: Column) {
    e.preventDefault();
    setOver(col);
  }

  function clearOver() {
    setOver(null);
  }

  function assign(id: string, role: Column) {
    setSelected((prev) => {
      const next: Record<string, Role> = { ...prev };

      if (role === "UNASSIGNED") {
        delete next[id];
        return next;
      }

      // enforce at most one PRIMARY
    //   if (role === "PRIMARY") {
    //     for (const [tid, r] of Object.entries(next)) {
    //       if (r === "PRIMARY") next[tid] = "SECONDARY";
    //     }
    //   }

      next[id] = role;
      return next;
    });
  }

  function onDrop(e: React.DragEvent, col: Column) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    assign(id, col);
    setOver(null);
  }

  const byId = React.useMemo(() => new Map(targets.map((t) => [t.id, t])), [targets]);

  const primaryIds = Object.entries(selected)
    .filter(([, r]) => r === "PRIMARY")
    .map(([id]) => id);
  const secondaryIds = Object.entries(selected)
    .filter(([, r]) => r === "SECONDARY")
    .map(([id]) => id);
  const stabilizerIds = Object.entries(selected)
    .filter(([, r]) => r === "STABILIZER")
    .map(([id]) => id);

  const selectedSet = new Set(Object.keys(selected));
  const unassignedIds = targets
    .filter((t) => !selectedSet.has(t.id))
    .map((t) => t.id);

  function renderChip(id: string) {
    const t = byId.get(id);
    if (!t) return null;

    const role = selected[id];

    return (
      <button
        key={id}
        type="button"
        draggable
        onDragStart={(e) => onDragStart(e, id)}
        onClick={() => {
          // click fallback: cycle roles (optional)
          const nextRole: Column =
            role === "PRIMARY" ? "SECONDARY" : role === "SECONDARY" ? "STABILIZER" : role === "STABILIZER" ? "UNASSIGNED" : "SECONDARY";
          assign(id, nextRole);
        }}
        className={[
          "inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm transition",
          "active:scale-[0.99]",
          role ? "border-ring bg-muted/60" : "border-input hover:bg-muted/40",
        ].join(" ")}
        title="Drag to assign role (click cycles)"
      >
        <span className="truncate max-w-[180px]">{t.name}</span>
        {role ? <Badge variant="secondary">{role}</Badge> : null}
      </button>
    );
  }

  function ColumnBox({
    title,
    col,
    ids,
    hint,
  }: {
    title: string;
    col: Column;
    ids: string[];
    hint?: string;
  }) {
    const isOver = over === col;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{ids.length}</div>
        </div>

        <div
          onDragOver={(e) => allowDrop(e, col)}
          onDragEnter={() => setOver(col)}
          onDragLeave={clearOver}
          onDrop={(e) => onDrop(e, col)}
          className={[
            "min-h-[88px] rounded-lg border p-2",
            isOver ? "border-ring ring-2 ring-ring bg-muted/40" : "border-input",
          ].join(" ")}
        >
          {ids.length > 0 ? (
            <div className="flex flex-wrap gap-2">{ids.sort((a, b) => (byId.get(a)?.name ?? "").localeCompare(byId.get(b)?.name ?? "")).map(renderChip)}</div>
          ) : (
            <div className="text-xs text-muted-foreground">{hint ?? "Drop here"}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden inputs for server action */}
      {Object.entries(selected).map(([id, role]) => (
        <React.Fragment key={id}>
          <input type="hidden" name="target_id" value={id} />
          <input type="hidden" name={`role:${id}`} value={role} />
        </React.Fragment>
      ))}

      {/* Unassigned pool */}
      <ColumnBox
        title="Unassigned"
        col="UNASSIGNED"
        ids={unassignedIds}
        hint="Drag a muscle group here to remove it"
      />

      {/* Role columns */}
      <div className="space-y-3">
     <ColumnBox title="Primary" col="PRIMARY" ids={primaryIds} />
     <ColumnBox title="Secondary" col="SECONDARY" ids={secondaryIds} />
     <ColumnBox title="Stabilizer" col="STABILIZER" ids={stabilizerIds} />
   </div>

      <div className="text-xs text-muted-foreground">
        Drag chips to assign roles. Click cycles Secondary → Stabilizer → Remove.
      </div>
    </div>
  );
}

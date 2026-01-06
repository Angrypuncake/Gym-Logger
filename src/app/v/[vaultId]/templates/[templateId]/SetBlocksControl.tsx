// src/app/v/[vaultId]/templates/[templateId]/SetBlocksControl.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  initialTargetSets: number | null;
  min?: number;
  max?: number;
  defaultIfUnset?: number;
  action: (formData: FormData) => void | Promise<void>;

  // fixed width area for blocks; blocks wrap inside this width
  blocksWidthClassName?: string; // e.g. "w-[240px]"
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function SetBlocksControl({
  initialTargetSets,
  min = 1,
  max = 12,
  defaultIfUnset = 3,
  action,
  blocksWidthClassName = "w-[240px]",
}: Props) {
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const hiddenRef = React.useRef<HTMLInputElement | null>(null);

  const [valueStr, setValueStr] = React.useState<string>(
    initialTargetSets == null ? "" : String(initialTargetSets)
  );

  const isUnset = valueStr.trim() === "";
  const displayCount = isUnset
    ? defaultIfUnset
    : clamp(Number(valueStr || defaultIfUnset), min, max);

  const [prevCount, setPrevCount] = React.useState(displayCount);
  React.useEffect(() => {
    setPrevCount(displayCount);
  }, [displayCount]);

  const submitWith = (nextStr: string) => {
    setValueStr(nextStr);
    if (hiddenRef.current) hiddenRef.current.value = nextStr;
    formRef.current?.requestSubmit();
  };

  const inc = () => {
    const next = clamp(displayCount + 1, min, max);
    submitWith(String(next));
  };

  const dec = () => {
    const next = clamp(displayCount - 1, min, max);
    submitWith(String(next));
  };

  const commitTyped = () => {
    const raw = valueStr.trim();
    if (raw === "") {
      submitWith("");
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    submitWith(String(clamp(parsed, min, max)));
  };

  const onNumberKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitTyped();
    }
  };

  return (
    <form ref={formRef} action={action} className="flex items-start gap-3">
      <input ref={hiddenRef} type="hidden" name="target_sets" defaultValue={valueStr} />
      <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />

      {/* Fixed-width wrapping block area */}
      <div className={["flex flex-wrap gap-1", blocksWidthClassName].join(" ")}>
        {Array.from({ length: displayCount }).map((_, idx) => {
          const isNew = displayCount > prevCount && idx >= prevCount;
          return (
            <div
              key={idx}
              className={[
                "h-8 w-8 rounded-md border border-border bg-muted/20",
                isUnset ? "opacity-40" : "",
                isNew ? "animate-in fade-in zoom-in-95 duration-150" : "",
              ].join(" ")}
            />
          );
        })}
      </div>

      {/* Controls: fixed position (doesn't shift when blocks wrap) */}
      <div className="flex items-center gap-2 shrink-0 self-start">
        <Button type="button" size="icon" variant="secondary" onClick={dec} aria-label="Decrease sets">
          −
        </Button>
        <Button type="button" size="icon" variant="secondary" onClick={inc} aria-label="Increase sets">
          +
        </Button>

        <div className="ml-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sets</span>
          <input
            inputMode="numeric"
            type="number"
            min={min}
            max={max}
            value={valueStr}
            placeholder={String(defaultIfUnset)}
            onChange={(e) => setValueStr(e.target.value)}
            onBlur={commitTyped}
            onKeyDown={onNumberKeyDown}
            className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm text-center outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {isUnset && <span className="text-xs text-muted-foreground">Default</span>}
        </div>
      </div>
    </form>
  );
}
